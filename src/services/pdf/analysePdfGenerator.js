const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execPromise = promisify(exec);

/**
 * Génère un PDF de fiche d'analyse à partir des données en BDD
 */
async function generateAnalysePDF(analyseId) {
  const Analyse = require('../../models/Analyse');
  const { fillAnalyseTemplate } = require('../template/analyseTemplateFiller');
  const { getDatabase, saveDatabase } = require('../../db/database');

  console.log(`📄 Génération PDF pour analyse #${analyseId}...`);

  try {
    const analyse = await Analyse.getById(analyseId);

    if (!analyse) {
      throw new Error(`Analyse #${analyseId} non trouvée`);
    }

    // Remplir le template Word
    const filledWordBuffer = await fillAnalyseTemplate(analyse);

    // Sauvegarder le Word temporaire
    const outputDir = process.env.OUTPUT_DIR || './output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const tempWordPath = path.join(outputDir, `analyse_${analyseId}_${Date.now()}.docx`);
    fs.writeFileSync(tempWordPath, filledWordBuffer);
    console.log('📁 Word temporaire créé:', tempWordPath);

    // Convertir Word → PDF via LibreOffice
    const libreOfficePath = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
    const command = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${tempWordPath}"`;

    console.log('🖨️  Conversion Word → PDF...');
    await execPromise(command, {
      timeout: 30000,
      windowsHide: true
    });

    // Trouver le PDF généré
    const generatedPdfName = path.basename(tempWordPath, '.docx') + '.pdf';
    const generatedPdfPath = path.join(outputDir, generatedPdfName);

    if (!fs.existsSync(generatedPdfPath)) {
      throw new Error('Le PDF n\'a pas été généré par LibreOffice');
    }

    // Renommer vers nom final
    const finalPdfPath = path.join(outputDir, `analyse_${analyseId}.pdf`);
    if (fs.existsSync(finalPdfPath)) {
      fs.unlinkSync(finalPdfPath);
    }
    fs.renameSync(generatedPdfPath, finalPdfPath);

    // Nettoyer le fichier Word temporaire
    fs.unlinkSync(tempWordPath);
    console.log('🗑️  Fichier temporaire supprimé');

    // Mettre à jour la BDD
    const db = await getDatabase();
    db.prepare(`
      UPDATE analyses
      SET pdf_output_path = ?,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(finalPdfPath, analyseId);
    saveDatabase();

    console.log('✅ PDF analyse généré avec succès:', finalPdfPath);
    return finalPdfPath;

  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF analyse:', error.message);
    throw error;
  }
}

module.exports = {
  generateAnalysePDF
};
