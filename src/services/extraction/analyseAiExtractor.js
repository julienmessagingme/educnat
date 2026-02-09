const Anthropic = require('@anthropic-ai/sdk');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extrait le texte brut d'un fichier (.docx ou .pdf)
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.docx') {
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const xml = zip.file('word/document.xml')?.asText();
    if (!xml) throw new Error('Impossible de lire le contenu du fichier Word');

    // Extraire le texte brut du XML
    return xml
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  }

  throw new Error(`Type de fichier non supporté: ${ext}`);
}

/**
 * Extrait les 16 champs d'analyse depuis plusieurs documents via Claude AI
 */
async function extractAnalyseWithAI(documents) {
  console.log(`🤖 Extraction IA analyse en cours (${documents.length} document(s))...`);

  // Concaténer tous les textes
  const allText = documents
    .map((doc, i) => `--- DOCUMENT ${i + 1}: ${doc.filename} ---\n${doc.text}`)
    .join('\n\n');

  const prompt = `Tu es un assistant spécialisé dans l'analyse de documents scolaires pour l'Éducation Nationale française.

Voici le contenu de ${documents.length} document(s) concernant un même élève. Extrais les informations suivantes et retourne-les au format JSON STRICT (pas de texte avant ou après le JSON) :

{
  "nomEnfant": "NOM de l'élève en MAJUSCULES",
  "prenomEnfant": "Prénom de l'élève",
  "dateDeNaissance": "Date de naissance (format libre)",
  "etablissementScolaire": "Nom de l'établissement scolaire",
  "classe": "Classe de l'élève",
  "problematique": "Synthèse de la problématique principale de l'élève",
  "motif": "Motif de la demande / saisine",
  "historique": "Historique de la situation (parcours, prises en charge antérieures)",
  "situation": "Description de la situation actuelle de l'élève",
  "partenaires": "Partenaires impliqués (professionnels, services, institutions)",
  "contexteFamilial": "Contexte familial de l'élève",
  "difficultes": "Difficultés identifiées (scolaires, comportementales, relationnelles)",
  "pointsAppui": "Points d'appui et ressources positives identifiés",
  "enClasse": "Comportement et fonctionnement en classe",
  "avecLaCommunaute": "Relations avec la communauté éducative",
  "demandeFormulee": "Demande formulée par l'équipe / la famille"
}

RÈGLES :
1. Pour chaque champ descriptif (problematique, motif, historique, situation, partenaires, contexteFamilial, difficultes, pointsAppui, enClasse, avecLaCommunaute, demandeFormulee), fais une synthèse de 100 mots MAXIMUM.
2. Si une information n'est pas trouvée dans les documents, retourne une chaîne vide "".
3. Croise les informations de tous les documents pour produire une synthèse complète.
4. Retourne UNIQUEMENT le JSON, rien d'autre.

Voici le contenu des documents :

---
${allText}
---

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    let extractedData;
    try {
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError.message);
      console.log('Réponse brute:', responseText);
      throw new Error('Impossible de parser la réponse de l\'IA');
    }

    console.log('✅ Extraction IA analyse terminée');
    return extractedData;

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction IA analyse:', error.message);
    throw error;
  }
}

module.exports = {
  extractTextFromFile,
  extractAnalyseWithAI
};
