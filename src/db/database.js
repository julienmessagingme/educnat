const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let SQL = null;

async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
}

async function getDatabase() {
  if (db) {
    return db;
  }

  // Initialiser sql.js si nécessaire
  if (!SQL) {
    await initDatabase();
  }

  const dbPath = process.env.DATABASE_PATH || './data/prd.db';
  const dbDir = path.dirname(dbPath);

  // Créer le dossier data s'il n'existe pas
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Charger la base de données existante ou en créer une nouvelle
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Activer les clés étrangères
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

function saveDatabase() {
  if (!db) return;

  const dbPath = process.env.DATABASE_PATH || './data/prd.db';
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

// Wrapper pour prepare/run qui sauvegarde automatiquement
class Statement {
  constructor(stmt) {
    this.stmt = stmt;
  }

  run(...params) {
    this.stmt.bind(params);
    this.stmt.step();
    this.stmt.reset();

    const changes = db.getRowsModified();

    // Récupérer le dernier ID inséré immédiatement
    const lastId = this.getLastInsertId();

    // Sauvegarder après chaque modification
    saveDatabase();

    // Pour compatibilité avec better-sqlite3
    return {
      changes: changes,
      lastInsertRowid: lastId
    };
  }

  get(...params) {
    this.stmt.bind(params);
    if (this.stmt.step()) {
      const result = this.stmt.getAsObject();
      this.stmt.reset();
      return result;
    }
    this.stmt.reset();
    return null;
  }

  all(...params) {
    this.stmt.bind(params);
    const results = [];
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject());
    }
    this.stmt.reset();
    return results;
  }

  getLastInsertId() {
    const stmt = db.prepare('SELECT last_insert_rowid() as id');
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.id;
  }
}

// Wrapper pour rendre l'API compatible avec better-sqlite3
const dbWrapper = {
  async init() {
    await getDatabase();
    return this;
  },

  prepare(sql) {
    if (!db) {
      throw new Error('Database not initialized. Call getDatabase() first.');
    }
    const stmt = db.prepare(sql);
    return new Statement(stmt);
  },

  exec(sql) {
    if (!db) {
      throw new Error('Database not initialized. Call getDatabase() first.');
    }
    db.exec(sql);
    saveDatabase();
  },

  pragma(pragma) {
    if (!db) {
      throw new Error('Database not initialized. Call getDatabase() first.');
    }
    db.run(pragma);
  }
};

module.exports = {
  getDatabase: async () => {
    await getDatabase();
    return dbWrapper;
  },
  closeDatabase,
  saveDatabase
};
