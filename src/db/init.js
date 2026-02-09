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
    'ALTER TABLE propositions ADD COLUMN temps2_commentaire TEXT',
    'ALTER TABLE propositions ADD COLUMN custom_motif TEXT'
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
      console.log('✅ Migration OK:', sql);
    } catch (e) {
      // Colonne existe déjà → on ignore
    }
  }

  // Migration : créer la table analyses si elle n'existe pas
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_files TEXT,
        nom_enfant TEXT,
        prenom_enfant TEXT,
        date_de_naissance TEXT,
        etablissement_scolaire TEXT,
        classe TEXT,
        problematique TEXT,
        motif TEXT,
        historique TEXT,
        situation TEXT,
        partenaires TEXT,
        contexte_familial TEXT,
        difficultes TEXT,
        points_appui TEXT,
        en_classe TEXT,
        avec_la_communaute TEXT,
        demande_formulee TEXT,
        contenu_brut TEXT,
        pdf_output_path TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table analyses OK');
  } catch (e) {
    // Table existe déjà → on ignore
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
