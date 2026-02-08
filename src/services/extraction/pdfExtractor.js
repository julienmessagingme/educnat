const pdfParse = require('pdf-parse');
const fs = require('fs');
const { extractWithAI } = require('./aiExtractor');

/**
 * Extrait les données d'un fichier PDF
 * @param {string} filePath - Chemin du fichier PDF
 * @returns {Promise<Object>} Données extraites
 */
async function extractFromPDF(filePath) {
  console.log('📄 Extraction du fichier PDF:', filePath);

  try {
    // 1. Lire le fichier PDF
    const dataBuffer = fs.readFileSync(filePath);

    // 2. Parser le PDF pour extraire le texte
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    console.log('📝 Contenu extrait, longueur:', text.length, 'caractères');
    console.log('📊 Pages:', pdfData.numpages);

    // 3. Extraction intelligente avec Claude AI
    const extractedData = await extractWithAI(text, 'pdf');

    return extractedData;

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction PDF:', error.message);
    throw error;
  }
}

module.exports = {
  extractFromPDF
};
