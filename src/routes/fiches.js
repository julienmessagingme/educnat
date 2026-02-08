const express = require('express');
const router = express.Router();
const Fiche = require('../models/Fiche');
const { validateFiche } = require('../utils/validators');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * GET /api/fiches
 * Liste paginée des fiches
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;
    const search = req.query.search || null;

    const result = await Fiche.list({ page, limit, status, search });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des fiches:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/fiches/:id
 * Détail d'une fiche
 */
router.get('/:id', async (req, res) => {
  try {
    const ficheId = parseInt(req.params.id);
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      return res.status(404).json({
        success: false,
        error: 'Fiche non trouvée'
      });
    }

    res.json({
      success: true,
      fiche: fiche
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de la fiche:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/fiches/:id/validate
 * Validation et correction des données extraites
 */
router.put('/:id/validate', async (req, res) => {
  try {
    const ficheId = parseInt(req.params.id);
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      return res.status(404).json({
        success: false,
        error: 'Fiche non trouvée'
      });
    }

    // Valider les données avec Zod
    const validatedData = validateFiche(req.body);

    // Mettre à jour la fiche
    const updated = await Fiche.update(ficheId, {
      ...validatedData,
      status: 'validated'
    });

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      });
    }

    // Récupérer la fiche mise à jour
    const updatedFiche = await Fiche.getById(ficheId);

    logger.info('Fiche validée:', { ficheId });

    res.json({
      success: true,
      message: 'Fiche validée avec succès',
      fiche: updatedFiche
    });

  } catch (error) {
    logger.error('Erreur lors de la validation:', error);

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
      error: error.message
    });
  }
});

/**
 * DELETE /api/fiches
 * Suppression de toutes les fiches (purge)
 */
router.delete('/', async (req, res) => {
  try {
    logger.warn('Purge de toutes les fiches demandée');

    // Récupérer toutes les fiches
    const allFiches = await Fiche.list({ page: 1, limit: 10000 });
    const fiches = allFiches.fiches;

    let deletedCount = 0;

    // Supprimer chaque fiche et ses fichiers
    for (const fiche of fiches) {
      // Supprimer les fichiers associés
      if (fiche.source_path && fs.existsSync(fiche.source_path)) {
        fs.unlinkSync(fiche.source_path);
      }
      if (fiche.pdf_output_path && fs.existsSync(fiche.pdf_output_path)) {
        fs.unlinkSync(fiche.pdf_output_path);
      }

      // Supprimer la fiche de la BDD
      await Fiche.delete(fiche.id);
      deletedCount++;
    }

    logger.info(`${deletedCount} fiche(s) supprimée(s)`);

    res.json({
      success: true,
      message: `${deletedCount} fiche(s) supprimée(s)`,
      deleted: deletedCount
    });

  } catch (error) {
    logger.error('Erreur lors de la purge:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/fiches/:id
 * Suppression d'une fiche et de ses fichiers
 */
router.delete('/:id', async (req, res) => {
  try {
    const ficheId = parseInt(req.params.id);
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      return res.status(404).json({
        success: false,
        error: 'Fiche non trouvée'
      });
    }

    // Supprimer les fichiers associés
    if (fiche.source_path && fs.existsSync(fiche.source_path)) {
      fs.unlinkSync(fiche.source_path);
      logger.info('Fichier source supprimé:', fiche.source_path);
    }

    if (fiche.pdf_output_path && fs.existsSync(fiche.pdf_output_path)) {
      fs.unlinkSync(fiche.pdf_output_path);
      logger.info('Fichier PDF supprimé:', fiche.pdf_output_path);
    }

    // Supprimer la fiche de la base
    const deleted = await Fiche.delete(ficheId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression'
      });
    }

    logger.info('Fiche supprimée:', { ficheId });

    res.json({
      success: true,
      message: 'Fiche supprimée avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/types-demande
 * Liste des types de demandes disponibles
 */
router.get('/reference/types-demande', async (req, res) => {
  try {
    const typesDemande = await Fiche.getTypesDemande();

    res.json({
      success: true,
      typesDemande
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des types de demande:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
