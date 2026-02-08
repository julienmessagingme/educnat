const { getDatabase } = require('./database');

async function updateDemandes() {
  try {
    const db = await getDatabase();

    console.log('🔄 Mise à jour des types de demandes...');

    // Supprimer les anciennes demandes
    db.prepare('DELETE FROM types_demande').run();

    // Insérer les 11 nouveaux types
    const demandes = [
      { code: 'SENSIBILISATION', libelle: 'Demande de sensibilisation, formation aux équipes' },
      { code: 'POSTURE_PRO', libelle: 'Appui et conseil aux enseignants : Posture professionnelle' },
      { code: 'GESTES_PRO', libelle: 'Appui et conseil aux enseignants : Gestes professionnels' },
      { code: 'PEDAGOGIE', libelle: 'Appui et conseil aux enseignants : Pédagogie auprès des élèves' },
      { code: 'AMENAGEMENT', libelle: 'Appui et conseil aux enseignants : Aménagement de l\'espace classe' },
      { code: 'EXPERTISE_COMPORTEMENT', libelle: 'Appui et conseil aux enseignants : Expertise troubles du comportement' },
      { code: 'EXPERTISE_TSA_PEDAGOGIE', libelle: 'Appui et conseil aux enseignants : Expertise TSA apports pédagogiques' },
      { code: 'EXPERTISE_TSA_AESH', libelle: 'Appui et conseil aux enseignants : Expertise TSA accompagnement AESH' },
      { code: 'EXPERTISE_NEURODEV', libelle: 'Appui et conseil aux enseignants : Expertise trouble neurodév.' },
      { code: 'COMMUNAUTE_EDUCATIVE', libelle: 'Appui et conseil à la communauté éducative' },
      { code: 'PARCOURS_SCOLAIRE', libelle: 'Aide à l\'élaboration du parcours scolaire et/ou de soin' }
    ];

    const stmt = db.prepare('INSERT INTO types_demande (code, libelle) VALUES (?, ?)');

    demandes.forEach(d => {
      stmt.run(d.code, d.libelle);
    });

    console.log('✅ 11 types de demandes mis à jour');

    const { saveDatabase } = require('./database');
    saveDatabase();

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateDemandes();
