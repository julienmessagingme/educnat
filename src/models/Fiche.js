let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    const { getDatabase } = require('../db/database');
    dbInstance = await getDatabase();
  }
  return dbInstance;
}

class Fiche {
  /**
   * Crée une nouvelle fiche
   */
  static async create(data) {
    const db = await getDb();

    const stmt = db.prepare(`
      INSERT INTO fiches (
        source_filename, source_type, source_path,
        nom, prenom, date_naissance, classe,
        etablissement_nom, etablissement_adresse, etablissement_email, etablissement_tel,
        origine_saisine, origine_nom, situation_remontee_par,
        date_demande, demandes_formulees, contenu_brut, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demandesJson = JSON.stringify(data.demandes || []);
    console.log('=== DEBUG FICHE.CREATE ===');
    console.log('demandes_formulees à stocker:', demandesJson);
    console.log('=========================');

    const result = stmt.run(
      data.sourceFilename,
      data.sourceType,
      data.sourcePath,
      data.nom,
      data.prenom,
      data.dateNaissance,
      data.classe,
      data.etablissementNom,
      data.etablissementAdresse,
      data.etablissementEmail,
      data.etablissementTel,
      data.origineSaisine,
      data.origineNom,
      data.situationRemontee,
      data.dateDemande,
      demandesJson,
      data.contenuBrut,
      data.status || 'pending'
    );

    return result.lastInsertRowid;
  }

  /**
   * Récupère une fiche par son ID
   */
  static async getById(id) {
    const db = await getDb();
    const fiche = db.prepare('SELECT * FROM fiches WHERE id = ?').get(id);

    if (!fiche) {
      return null;
    }

    // Parser le JSON des demandes
    console.log('=== DEBUG FICHE.GETBYID ===');
    console.log('demandes_formulees brut depuis BDD:', fiche.demandes_formulees);
    console.log('===========================');
    if (fiche.demandes_formulees) {
      fiche.demandes = JSON.parse(fiche.demandes_formulees);
    }

    return fiche;
  }

  /**
   * Liste toutes les fiches avec pagination
   */
  static async list({ page = 1, limit = 20, status = null, search = null }) {
    const db = await getDb();
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM fiches WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (nom LIKE ? OR prenom LIKE ? OR source_filename LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const fiches = db.prepare(query).all(...params);

    // Parser les demandes pour chaque fiche
    fiches.forEach(fiche => {
      if (fiche.demandes_formulees) {
        fiche.demandes = JSON.parse(fiche.demandes_formulees);
      }
    });

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM fiches WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (nom LIKE ? OR prenom LIKE ? OR source_filename LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    return {
      fiches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Met à jour une fiche
   */
  static async update(id, data) {
    const db = await getDb();

    const fields = [];
    const values = [];

    // Mapping camelCase (frontend/Zod) → snake_case (BDD)
    const fieldMapping = {
      nom: 'nom',
      prenom: 'prenom',
      dateNaissance: 'date_naissance',
      date_naissance: 'date_naissance',
      classe: 'classe',
      etablissementNom: 'etablissement_nom',
      etablissement_nom: 'etablissement_nom',
      etablissementAdresse: 'etablissement_adresse',
      etablissement_adresse: 'etablissement_adresse',
      etablissementEmail: 'etablissement_email',
      etablissement_email: 'etablissement_email',
      etablissementTel: 'etablissement_tel',
      etablissement_tel: 'etablissement_tel',
      origineSaisine: 'origine_saisine',
      origine_saisine: 'origine_saisine',
      origineNom: 'origine_nom',
      origine_nom: 'origine_nom',
      situationRemontee: 'situation_remontee_par',
      situation_remontee_par: 'situation_remontee_par',
      dateDemande: 'date_demande',
      date_demande: 'date_demande',
      status: 'status',
      pdf_output_path: 'pdf_output_path',
      processed_at: 'processed_at'
    };

    // Eviter les doublons si les deux conventions sont présentes
    const addedDbFields = new Set();

    Object.entries(fieldMapping).forEach(([dataKey, dbField]) => {
      if (data[dataKey] !== undefined && !addedDbFields.has(dbField)) {
        fields.push(`${dbField} = ?`);
        values.push(data[dataKey]);
        addedDbFields.add(dbField);
      }
    });

    // Gérer les demandes (JSON)
    if (data.demandes !== undefined) {
      fields.push('demandes_formulees = ?');
      values.push(JSON.stringify(data.demandes));
    }

    // Toujours mettre à jour updated_at
    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const query = `UPDATE fiches SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...values);

    // Forcer la sauvegarde avec sql.js
    const { saveDatabase } = require('../db/database');
    saveDatabase();

    return result.changes > 0;
  }

  /**
   * Supprime une fiche
   */
  static async delete(id) {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM fiches WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Récupère les types de demandes disponibles
   */
  static async getTypesDemande() {
    const db = await getDb();
    return db.prepare('SELECT * FROM types_demande ORDER BY libelle').all();
  }
}

module.exports = Fiche;
