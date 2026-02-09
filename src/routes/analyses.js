const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../config/upload');
const Analyse = require('../models/Analyse');
const { extractTextFromFile, extractAnalyseWithAI } = require('../services/extraction/analyseAiExtractor');
const { generateAnalysePDF } = require('../services/pdf/analysePdfGenerator');
const { validateAnalyse } = require('../utils/analyseValidators');
const logger = require('../utils/logger');

/**
 * POST /api/analyses/upload
 * Upload multi-fichiers + extraction IA
 */
router.post('/upload', (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      logger.error('Erreur multer:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Erreur lors de l\'upload des fichiers'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier envoyé'
      });
    }

    logger.info(`Upload analyse: ${req.files.length} fichier(s)`);

    // Extraire le texte de chaque fichier
    const documents = [];
    const sourceFiles = [];

    for (const file of req.files) {
      try {
        const text = await extractTextFromFile(file.path);
        documents.push({
          filename: file.originalname,
          text
        });
        sourceFiles.push({
          filename: file.originalname,
          type: path.extname(file.originalname).replace('.', ''),
          path: file.path
        });
      } catch (err) {
        logger.error(`Erreur extraction fichier ${file.originalname}:`, err);
      }
    }

    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible d\'extraire le texte des fichiers'
      });
    }

    // Appel IA pour extraire les 16 champs
    const aiData = await extractAnalyseWithAI(documents);

    // Créer l'analyse en BDD
    const contenuBrut = documents.map(d => d.text).join('\n\n---\n\n');

    const analyseId = await Analyse.create({
      sourceFiles,
      nomEnfant: aiData.nomEnfant || '',
      prenomEnfant: aiData.prenomEnfant || '',
      dateDeNaissance: aiData.dateDeNaissance || '',
      etablissementScolaire: aiData.etablissementScolaire || '',
      classe: aiData.classe || '',
      problematique: aiData.problematique || '',
      motif: aiData.motif || '',
      historique: aiData.historique || '',
      situation: aiData.situation || '',
      partenaires: aiData.partenaires || '',
      contexteFamilial: aiData.contexteFamilial || '',
      difficultes: aiData.difficultes || '',
      pointsAppui: aiData.pointsAppui || '',
      enClasse: aiData.enClasse || '',
      avecLaCommunaute: aiData.avecLaCommunaute || '',
      demandeFormulee: aiData.demandeFormulee || '',
      contenuBrut,
      status: 'pending'
    });

    logger.info('Analyse créée:', { analyseId });

    res.json({
      success: true,
      analyseId,
      message: `${documents.length} document(s) analysé(s) avec succès`
    });

  } catch (error) {
    logger.error('Erreur lors de l\'upload analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse'
    });
  }
});

/**
 * GET /api/analyses
 * Liste paginée des analyses
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await Analyse.list({ page, limit });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des analyses:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analyses/:id
 * Détail d'une analyse
 */
router.get('/:id', async (req, res) => {
  try {
    const analyseId = parseInt(req.params.id);
    const analyse = await Analyse.getById(analyseId);

    if (!analyse) {
      return res.status(404).json({
        success: false,
        error: 'Analyse non trouvée'
      });
    }

    res.json({
      success: true,
      analyse
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/analyses/:id/validate
 * Mise à jour des 16 champs + status → validated
 */
router.put('/:id/validate', async (req, res) => {
  try {
    const analyseId = parseInt(req.params.id);
    const analyse = await Analyse.getById(analyseId);

    if (!analyse) {
      return res.status(404).json({
        success: false,
        error: 'Analyse non trouvée'
      });
    }

    const validatedData = validateAnalyse(req.body);

    const updated = await Analyse.update(analyseId, {
      ...validatedData,
      status: 'validated'
    });

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      });
    }

    const updatedAnalyse = await Analyse.getById(analyseId);

    logger.info('Analyse validée:', { analyseId });

    res.json({
      success: true,
      message: 'Analyse validée avec succès',
      analyse: updatedAnalyse
    });

  } catch (error) {
    logger.error('Erreur lors de la validation de l\'analyse:', error);

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
 * POST /api/analyses/:id/generate-pdf
 * Génère le PDF via template + LibreOffice
 */
router.post('/:id/generate-pdf', async (req, res) => {
  try {
    const analyseId = parseInt(req.params.id);

    const analyse = await Analyse.getById(analyseId);

    if (!analyse) {
      return res.status(404).json({
        success: false,
        error: 'Analyse non trouvée'
      });
    }

    const pdfPath = await generateAnalysePDF(analyseId);

    logger.info('PDF analyse généré:', { analyseId, pdfPath });

    res.json({
      success: true,
      message: 'PDF généré avec succès',
      pdfUrl: `/api/analyses/${analyseId}/pdf`
    });

  } catch (error) {
    logger.error('Erreur lors de la génération du PDF analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération du PDF'
    });
  }
});

/**
 * GET /api/analyses/:id/pdf
 * Servir le PDF (iframe + download)
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const analyseId = parseInt(req.params.id);
    const forceDownload = req.query.download === 'true';

    const analyse = await Analyse.getById(analyseId);

    if (!analyse) {
      return res.status(404).json({
        success: false,
        error: 'Analyse non trouvée'
      });
    }

    if (!analyse.pdf_output_path) {
      return res.status(404).json({
        success: false,
        error: 'Aucun PDF généré pour cette analyse'
      });
    }

    const pdfPath = analyse.pdf_output_path;

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        error: 'Fichier PDF introuvable'
      });
    }

    const filename = `analyse_${analyse.nom_enfant || ''}_${analyse.prenom_enfant || ''}_${analyseId}.pdf`;

    if (forceDownload) {
      res.download(pdfPath, filename);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.sendFile(path.resolve(pdfPath));
    }

  } catch (error) {
    logger.error('Erreur lors de l\'accès au PDF analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/analyses/:id
 * Suppression analyse + fichiers
 */
router.delete('/:id', async (req, res) => {
  try {
    const analyseId = parseInt(req.params.id);
    const analyse = await Analyse.getById(analyseId);

    if (!analyse) {
      return res.status(404).json({
        success: false,
        error: 'Analyse non trouvée'
      });
    }

    // Supprimer les fichiers source
    if (analyse.source_files) {
      try {
        const files = JSON.parse(analyse.source_files);
        for (const f of files) {
          if (f.path && fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        }
      } catch {}
    }

    // Supprimer le PDF
    if (analyse.pdf_output_path && fs.existsSync(analyse.pdf_output_path)) {
      fs.unlinkSync(analyse.pdf_output_path);
    }

    const deleted = await Analyse.delete(analyseId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression'
      });
    }

    logger.info('Analyse supprimée:', { analyseId });

    res.json({
      success: true,
      message: 'Analyse supprimée avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
