const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../config/upload');
const { extractFromWord } = require('../services/extraction/wordExtractor');
const { extractFromPDF } = require('../services/extraction/pdfExtractor');
const Fiche = require('../models/Fiche');
const logger = require('../utils/logger');

/**
 * POST /api/upload
 * Upload un fichier (PDF ou DOCX) et extraction des données
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier uploadé'
      });
    }

    logger.info('Fichier uploadé:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    let extractedData;

    // Extraction selon le type de fichier
    if (fileExt === '.docx') {
      extractedData = await extractFromWord(filePath);
    } else if (fileExt === '.pdf') {
      extractedData = await extractFromPDF(filePath);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Type de fichier non supporté'
      });
    }

    console.log('=== DEBUG UPLOAD ===');
    console.log('Demandes retournées par l\'IA:', JSON.stringify(extractedData.demandes));
    console.log('===================');

    // Créer la fiche dans la base de données
    const ficheId = await Fiche.create({
      sourceFilename: req.file.originalname,
      sourceType: fileExt.replace('.', ''),
      sourcePath: filePath,
      nom: extractedData.nom || '',
      prenom: extractedData.prenom || '',
      dateNaissance: extractedData.dateNaissance || null,
      classe: extractedData.classe || null,
      etablissementNom: extractedData.etablissementNom || null,
      etablissementAdresse: extractedData.etablissementAdresse || null,
      etablissementEmail: extractedData.etablissementEmail || null,
      etablissementTel: extractedData.etablissementTel || null,
      origineSaisine: extractedData.origineSaisine || null,
      origineNom: extractedData.origineNom || null,
      situationRemontee: null,
      dateDemande: extractedData.dateDemande || null,
      demandes: extractedData.demandes || [],
      contenuBrut: extractedData.contenuBrut,
      status: 'pending'
    });

    logger.info('Fiche créée avec succès:', { ficheId });

    // Récupérer la fiche complète
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      logger.error('Erreur: fiche non trouvée après création:', { ficheId });
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde de la fiche'
      });
    }

    res.json({
      success: true,
      message: 'Fichier uploadé et données extraites avec succès',
      ficheId: ficheId,
      extractedData: {
        nom: fiche.nom || extractedData.nom,
        prenom: fiche.prenom || extractedData.prenom,
        dateNaissance: fiche.date_naissance || extractedData.dateNaissance,
        classe: fiche.classe || extractedData.classe,
        etablissementNom: fiche.etablissement_nom || extractedData.etablissementNom,
        etablissementAdresse: fiche.etablissement_adresse || extractedData.etablissementAdresse,
        etablissementEmail: fiche.etablissement_email || extractedData.etablissementEmail,
        etablissementTel: fiche.etablissement_tel || extractedData.etablissementTel,
        origineSaisine: fiche.origine_saisine || extractedData.origineSaisine,
        origineNom: fiche.origine_nom || extractedData.origineNom,
        situationRemontee: fiche.situation_remontee_par || extractedData.situationRemontee,
        dateDemande: fiche.date_demande || extractedData.dateDemande,
        demandes: fiche.demandes || extractedData.demandes
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'upload:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du traitement du fichier'
    });
  }
});

module.exports = router;
