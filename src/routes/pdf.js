const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateFichePDF } = require('../services/pdf/pdfGenerator');
const Fiche = require('../models/Fiche');
const logger = require('../utils/logger');

/**
 * POST /api/fiches/:id/generate-pdf
 * Génère le PDF de retour de saisine
 */
router.post('/:id/generate-pdf', async (req, res) => {
  try {
    const ficheId = parseInt(req.params.id);

    logger.info('Génération PDF demandée:', { ficheId });

    // Vérifier que la fiche existe
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      return res.status(404).json({
        success: false,
        error: 'Fiche non trouvée'
      });
    }

    // Vérifier que la fiche est validée
    if (fiche.status === 'pending') {
      return res.status(400).json({
        success: false,
        error: 'La fiche doit être validée avant de générer le PDF'
      });
    }

    // Générer le PDF
    const pdfPath = await generateFichePDF(ficheId);

    logger.info('PDF généré avec succès:', { ficheId, pdfPath });

    res.json({
      success: true,
      message: 'PDF généré avec succès',
      pdfUrl: `/api/fiches/${ficheId}/pdf`
    });

  } catch (error) {
    logger.error('Erreur lors de la génération du PDF:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération du PDF'
    });
  }
});

/**
 * GET /api/fiches/:id/pdf
 * Affiche ou télécharge le PDF généré
 * Query param: ?download=true pour forcer le téléchargement
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const ficheId = parseInt(req.params.id);
    const forceDownload = req.query.download === 'true';

    // Récupérer la fiche
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      return res.status(404).json({
        success: false,
        error: 'Fiche non trouvée'
      });
    }

    // Vérifier que le PDF existe
    if (!fiche.pdf_output_path) {
      return res.status(404).json({
        success: false,
        error: 'Aucun PDF généré pour cette fiche'
      });
    }

    const pdfPath = fiche.pdf_output_path;

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        error: 'Fichier PDF introuvable'
      });
    }

    // Nom du fichier
    const filename = `fiche_${fiche.nom}_${fiche.prenom}_${ficheId}.pdf`;

    if (forceDownload) {
      // Forcer le téléchargement
      logger.info('Téléchargement PDF:', { ficheId, filename });
      res.download(pdfPath, filename);
    } else {
      // Afficher dans le navigateur/iframe
      logger.info('Affichage PDF:', { ficheId, filename });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.sendFile(path.resolve(pdfPath));
    }

  } catch (error) {
    logger.error('Erreur lors de l\'accès au PDF:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'accès au PDF'
    });
  }
});

module.exports = router;
