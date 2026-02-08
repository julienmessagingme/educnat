const { getDatabase } = require('./database');

async function migrate() {
  try {
    const db = await getDatabase();

    console.log('🔄 Application de la migration...');

    // Vérifier si la colonne existe déjà
    const tableInfo = db.prepare('PRAGMA table_info(propositions)').all();
    const columnExists = tableInfo.some(col => col.name === 'evaluation_situation');

    if (columnExists) {
      console.log('✅ La colonne evaluation_situation existe déjà');
    } else {
      db.prepare('ALTER TABLE propositions ADD COLUMN evaluation_situation TEXT').run();
      console.log('✅ Colonne evaluation_situation ajoutée avec succès');
    }

    // Ajouter temps2_date et temps2_commentaire
    const hasTemps2Date = tableInfo.some(col => col.name === 'temps2_date');
    if (!hasTemps2Date) {
      db.prepare('ALTER TABLE propositions ADD COLUMN temps2_date TEXT').run();
      console.log('✅ Colonne temps2_date ajoutée avec succès');
    } else {
      console.log('✅ La colonne temps2_date existe déjà');
    }

    const hasTemps2Commentaire = tableInfo.some(col => col.name === 'temps2_commentaire');
    if (!hasTemps2Commentaire) {
      db.prepare('ALTER TABLE propositions ADD COLUMN temps2_commentaire TEXT').run();
      console.log('✅ Colonne temps2_commentaire ajoutée avec succès');
    } else {
      console.log('✅ La colonne temps2_commentaire existe déjà');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

migrate();
