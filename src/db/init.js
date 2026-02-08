#!/usr/bin/env node

/**
 * Script d'initialisation de la base de données
 * Usage: node src/db/init.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./database');

async function initDatabase() {
  console.log('🗄️  Initialisation de la base de données...');

  const db = await getDatabase();

  // Lire le schéma SQL
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Exécuter le schéma
  db.exec(schema);

  // Migrations : ajouter les colonnes manquantes sur BDD existante
  const migrations = [
    'ALTER TABLE propositions ADD COLUMN evaluation_situation TEXT',
    'ALTER TABLE propositions ADD COLUMN temps2_date TEXT',
    'ALTER TABLE propositions ADD COLUMN temps2_commentaire TEXT'
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
      console.log('✅ Migration OK:', sql);
    } catch (e) {
      // Colonne existe déjà → on ignore
    }
  }

  console.log('✅ Base de données initialisée avec succès !');
}

// Exécuter si appelé directement
if (require.main === module) {
  initDatabase().then(() => {
    console.log('\n✅ Terminé !');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
}

module.exports = { initDatabase };
