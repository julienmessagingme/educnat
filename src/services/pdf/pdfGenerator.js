const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execPromise = promisify(exec);

/**
 * Convertit un fichier Word en PDF via LibreOffice
 * @param {string} wordFilePath - Chemin du fichier Word source
 * @param {string} outputPdfPath - Chemin du fichier PDF de sortie
 * @returns {Promise<string>} Chemin du PDF généré
 */
async function convertWordToPDF(wordFilePath, outputPdfPath) {
  console.log('🖨️  Conversion Word → PDF avec LibreOffice...');
  console.log('   Source:', wordFilePath);
  console.log('   Destination:', outputPdfPath);

  try {
    // Vérifier que le fichier Word existe
    if (!fs.existsSync(wordFilePath)) {
      throw new Error(`Fichier Word non trouvé: ${wordFilePath}`);
    }

    // Créer le dossier de sortie si nécessaire
    const outputDir = path.dirname(outputPdfPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Chemin de LibreOffice (Windows)
    const libreOfficePath = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

    // Conversion avec LibreOffice en mode headless
    const command = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${wordFilePath}"`;

    console.log('   Exécution de la conversion...');
    const { stdout, stderr } = await execPromise(command, {
      timeout: 30000, // 30 secondes max
      windowsHide: true
    });

    if (stderr && !stderr.includes('convert')) {
      console.warn('   Avertissement LibreOffice:', stderr);
    }

    // LibreOffice génère le PDF avec le même nom que le Word
    const generatedPdfName = path.basename(wordFilePath, path.extname(wordFilePath)) + '.pdf';
    const generatedPdfPath = path.join(outputDir, generatedPdfName);

    // Vérifier que le PDF a été généré
    if (!fs.existsSync(generatedPdfPath)) {
      throw new Error('Le PDF n\'a pas été généré par LibreOffice');
    }

    // Renommer si nécessaire
    if (generatedPdfPath !== outputPdfPath) {
      if (fs.existsSync(outputPdfPath)) {
        fs.unlinkSync(outputPdfPath); // Supprimer l'ancien si existe
      }
      fs.renameSync(generatedPdfPath, outputPdfPath);
    }

    console.log('✅ Conversion PDF terminée:', outputPdfPath);

    return outputPdfPath;

  } catch (error) {
    console.error('❌ Erreur lors de la conversion PDF:', error.message);
    throw error;
  }
}

/**
 * Génère un PDF complet à partir des données d'une fiche
 * @param {number} ficheId - ID de la fiche
 * @returns {Promise<string>} Chemin du PDF généré
 */
async function generateFichePDF(ficheId) {
  const Fiche = require('../../models/Fiche');
  const { fillWordTemplate } = require('../template/wordTemplateFiller');
  const { getDatabase } = require('../../db/database');

  console.log(`📄 Génération PDF pour fiche #${ficheId}...`);

  try {
    // 1. Récupérer les données de la fiche
    const fiche = await Fiche.getById(ficheId);

    if (!fiche) {
      throw new Error(`Fiche #${ficheId} non trouvée`);
    }

    // 2. Récupérer la proposition Temps 1
    const db = await getDatabase();
    const proposition = db.prepare(`
      SELECT * FROM propositions
      WHERE fiche_id = ? AND temps = 1
    `).get(ficheId);

    let propositionData = null;
    if (proposition) {
      propositionData = {
        date_proposition: proposition.date_proposition,
        motifs_principaux: JSON.parse(proposition.motifs_principaux || '[]'),
        evaluation_situation: JSON.parse(proposition.evaluation_situation || '[]'),
        commentaire: proposition.commentaire,
        temps2_date: proposition.temps2_date,
        temps2_commentaire: proposition.temps2_commentaire
      };
    }

    // 3. Remplir le template Word
    const filledWordBuffer = await fillWordTemplate(fiche, propositionData);

    // 3. Sauvegarder le Word temporaire
    const tempWordPath = path.join(
      process.env.OUTPUT_DIR || './output',
      `fiche_${ficheId}_${Date.now()}.docx`
    );

    fs.writeFileSync(tempWordPath, filledWordBuffer);
    console.log('📁 Word temporaire créé:', tempWordPath);

    // 4. Convertir Word → PDF
    const outputPdfPath = path.join(
      process.env.OUTPUT_DIR || './output',
      `fiche_${ficheId}.pdf`
    );

    await convertWordToPDF(tempWordPath, outputPdfPath);

    // 5. Nettoyer le fichier temporaire
    fs.unlinkSync(tempWordPath);
    console.log('🗑️  Fichier temporaire supprimé');

    // 6. Mettre à jour la fiche avec le chemin du PDF
    // Mise à jour directe dans la BDD
    db.prepare(`
      UPDATE fiches
      SET pdf_output_path = ?,
          status = 'completed',
          processed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(outputPdfPath, new Date().toISOString(), ficheId);

    // Forcer la sauvegarde
    const { saveDatabase } = require('../../db/database');
    saveDatabase();

    console.log('✅ PDF généré avec succès:', outputPdfPath);
    console.log('✅ Base de données mise à jour pour fiche #' + ficheId);

    return outputPdfPath;

  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error.message);
    throw error;
  }
}

module.exports = {
  convertWordToPDF,
  generateFichePDF
};
