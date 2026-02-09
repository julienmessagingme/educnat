let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    const { getDatabase } = require('../db/database');
    dbInstance = await getDatabase();
  }
  return dbInstance;
}

class Analyse {
  static async create(data) {
    const db = await getDb();

    const stmt = db.prepare(`
      INSERT INTO analyses (
        source_files, nom_enfant, prenom_enfant, date_de_naissance,
        etablissement_scolaire, classe,
        problematique, motif, historique, situation, partenaires,
        contexte_familial, difficultes, points_appui, en_classe,
        avec_la_communaute, demande_formulee, contenu_brut, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      JSON.stringify(data.sourceFiles || []),
      data.nomEnfant || '',
      data.prenomEnfant || '',
      data.dateDeNaissance || '',
      data.etablissementScolaire || '',
      data.classe || '',
      data.problematique || '',
      data.motif || '',
      data.historique || '',
      data.situation || '',
      data.partenaires || '',
      data.contexteFamilial || '',
      data.difficultes || '',
      data.pointsAppui || '',
      data.enClasse || '',
      data.avecLaCommunaute || '',
      data.demandeFormulee || '',
      data.contenuBrut || '',
      data.status || 'pending'
    );

    return result.lastInsertRowid;
  }

  static async getById(id) {
    const db = await getDb();
    const analyse = db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);

    if (!analyse) return null;

    if (analyse.source_files) {
      try { analyse.source_files_parsed = JSON.parse(analyse.source_files); } catch { analyse.source_files_parsed = []; }
    }

    return analyse;
  }

  static async list({ page = 1, limit = 20 }) {
    const db = await getDb();
    const offset = (page - 1) * limit;

    const analyses = db.prepare(
      'SELECT * FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);

    const { total } = db.prepare('SELECT COUNT(*) as total FROM analyses').get();

    return {
      analyses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id, data) {
    const db = await getDb();

    const fields = [];
    const values = [];

    const fieldMapping = {
      nomEnfant: 'nom_enfant',
      nom_enfant: 'nom_enfant',
      prenomEnfant: 'prenom_enfant',
      prenom_enfant: 'prenom_enfant',
      dateDeNaissance: 'date_de_naissance',
      date_de_naissance: 'date_de_naissance',
      etablissementScolaire: 'etablissement_scolaire',
      etablissement_scolaire: 'etablissement_scolaire',
      classe: 'classe',
      problematique: 'problematique',
      motif: 'motif',
      historique: 'historique',
      situation: 'situation',
      partenaires: 'partenaires',
      contexteFamilial: 'contexte_familial',
      contexte_familial: 'contexte_familial',
      difficultes: 'difficultes',
      pointsAppui: 'points_appui',
      points_appui: 'points_appui',
      enClasse: 'en_classe',
      en_classe: 'en_classe',
      avecLaCommunaute: 'avec_la_communaute',
      avec_la_communaute: 'avec_la_communaute',
      demandeFormulee: 'demande_formulee',
      demande_formulee: 'demande_formulee',
      status: 'status',
      pdf_output_path: 'pdf_output_path'
    };

    const addedDbFields = new Set();

    Object.entries(fieldMapping).forEach(([dataKey, dbField]) => {
      if (data[dataKey] !== undefined && !addedDbFields.has(dbField)) {
        fields.push(`${dbField} = ?`);
        values.push(data[dataKey]);
        addedDbFields.add(dbField);
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length <= 1) return false;

    values.push(id);

    const query = `UPDATE analyses SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...values);

    const { saveDatabase } = require('../db/database');
    saveDatabase();

    return result.changes > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM analyses WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

module.exports = Analyse;
