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
 * Échappe les retours à la ligne réels à l'intérieur des chaînes JSON
 * pour éviter les erreurs de parsing (les puces • génèrent de vrais \n)
 */
function fixJsonNewlines(text) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++; // skip \r\n pair
      }
      result += '\\n';
      continue;
    }

    result += char;
  }

  return result;
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
  "problematique": "Synthèse de la problématique principale",
  "motif": "Motif de la demande / saisine",
  "historique": "Historique de la situation (parcours, prises en charge antérieures)",
  "situation": "Situation actuelle de l'élève + dates d'obtention des accords (MDPH, CDAPH, notifications, renouvellements, etc.)",
  "partenaires": "Partenaires impliqués (professionnels, services, institutions)",
  "contexteFamilial": "Contexte familial de l'élève",
  "difficultes": "Difficultés identifiées (scolaires, comportementales, relationnelles)",
  "pointsAppui": "Points d'appui et ressources positives identifiés",
  "enClasse": "Comportement et fonctionnement en classe",
  "avecLaCommunaute": "Relations avec la communauté éducative",
  "demandeFormulee": "Demande formulée par l'équipe / la famille"
}

RÈGLES :
1. Pour chaque champ descriptif (problematique, motif, historique, situation, partenaires, contexteFamilial, difficultes, pointsAppui, enClasse, avecLaCommunaute, demandeFormulee), retourne une liste à puces ULTRA SYNTHÉTIQUE. Chaque puce commence par "• " et contient une info clé en quelques mots. Maximum 5-6 puces par champ. Sépare les puces par un retour à la ligne "\n".
2. Pour le champ "situation", inclus impérativement les dates d'obtention des accords trouvées dans les documents (accords MDPH, CDAPH, notifications AESH, renouvellements, PPS, etc.) sous forme de puces avec les dates.
3. Si une information n'est pas trouvée dans les documents, retourne une chaîne vide "".
4. Croise les informations de tous les documents pour produire une synthèse complète.
5. Retourne UNIQUEMENT le JSON, rien d'autre.

EXEMPLE DE FORMAT ATTENDU pour un champ :
"difficultes": "• Troubles du comportement en classe\n• Difficultés relationnelles avec les pairs\n• Retard scolaire en lecture et mathématiques"
"situation": "• Scolarisé en CE2 avec AESH 12h/semaine\n• Accord MDPH obtenu le 15/03/2024\n• Notification AESH renouvelée le 10/09/2024\n• Suivi orthophoniste 2x/semaine"

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
      let cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Échapper les retours à la ligne à l'intérieur des chaînes JSON
      // (les puces génèrent de vrais \n qui cassent JSON.parse)
      cleanedText = fixJsonNewlines(cleanedText);
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
