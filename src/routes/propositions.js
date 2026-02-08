const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');
const { validateProposition } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * GET /api/propositions/reference/motifs-principaux
 * Liste des motifs principaux disponibles
 * IMPORTANT: Cette route doit être AVANT /:ficheId/:temps
 */
router.get('/reference/motifs-principaux', async (req, res) => {
  try {
    const db = await getDatabase();

    const motifs = db.prepare(`
      SELECT * FROM motifs_principaux
      ORDER BY ordre, id
    `).all();

    res.json({
      success: true,
      motifs
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des motifs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/propositions
 * Sauvegarde une proposition (Temps 1 ou Temps 2)
 */
router.post('/', async (req, res) => {
  try {
    // Valider les données
    const validatedData = validateProposition(req.body);

    const db = await getDatabase();

    // Vérifier si une proposition existe déjà pour cette fiche et ce temps
    const existing = db.prepare(`
      SELECT id FROM propositions
      WHERE fiche_id = ? AND temps = ?
    `).get(validatedData.ficheId, validatedData.temps);

    if (existing) {
      // Mettre à jour
      db.prepare(`
        UPDATE propositions
        SET date_proposition = ?,
            motifs_principaux = ?,
            evaluation_situation = ?,
            commentaire = ?,
            temps2_date = ?,
            temps2_commentaire = ?
        WHERE id = ?
      `).run(
        validatedData.dateProposition,
        JSON.stringify(validatedData.motifsPrincipaux || []),
        JSON.stringify(validatedData.evaluationSituation || []),
        validatedData.commentaire || null,
        validatedData.temps2Date || null,
        validatedData.temps2Commentaire || null,
        existing.id
      );

      logger.info('Proposition mise à jour:', { id: existing.id });

      res.json({
        success: true,
        message: 'Proposition mise à jour',
        propositionId: existing.id
      });

    } else {
      // Créer
      const result = db.prepare(`
        INSERT INTO propositions (fiche_id, temps, date_proposition, motifs_principaux, evaluation_situation, commentaire, temps2_date, temps2_commentaire)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        validatedData.ficheId,
        validatedData.temps,
        validatedData.dateProposition,
        JSON.stringify(validatedData.motifsPrincipaux || []),
        JSON.stringify(validatedData.evaluationSituation || []),
        validatedData.commentaire || null,
        validatedData.temps2Date || null,
        validatedData.temps2Commentaire || null
      );

      logger.info('Proposition créée:', { id: result.lastInsertRowid });

      res.json({
        success: true,
        message: 'Proposition créée',
        propositionId: result.lastInsertRowid
      });
    }

  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de la proposition:', error);

    // Erreur de validation Zod
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la sauvegarde'
    });
  }
});

/**
 * GET /api/propositions/:ficheId/:temps
 * Récupère la proposition pour une fiche et un temps donnés
 */
router.get('/:ficheId/:temps', async (req, res) => {
  try {
    const ficheId = parseInt(req.params.ficheId);
    const temps = parseInt(req.params.temps);

    const db = await getDatabase();

    const proposition = db.prepare(`
      SELECT * FROM propositions
      WHERE fiche_id = ? AND temps = ?
    `).get(ficheId, temps);

    if (!proposition) {
      return res.status(404).json({
        success: false,
        error: 'Proposition non trouvée'
      });
    }

    // Parser le JSON des motifs et evaluation
    if (proposition.motifs_principaux) {
      proposition.motifs = JSON.parse(proposition.motifs_principaux);
    }
    if (proposition.evaluation_situation) {
      proposition.evaluation = JSON.parse(proposition.evaluation_situation);
    }

    res.json({
      success: true,
      proposition
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de la proposition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
