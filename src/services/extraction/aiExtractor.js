const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extrait les données d'une fiche de saisine PRD en utilisant Claude AI
 * @param {string} textContent - Contenu textuel du document
 * @param {string} sourceType - Type de fichier ('pdf' ou 'docx')
 * @returns {Promise<Object>} Données extraites structurées
 */
async function extractWithAI(textContent, sourceType = 'docx') {
  console.log('🤖 Extraction IA en cours...');

  const prompt = `Tu es un assistant spécialisé dans l'extraction de données de fiches de saisine PRD (Pôle Ressources Départemental) de l'Éducation Nationale.

Voici le contenu d'une fiche de saisine PRD. Les textes surlignés en couleur dans le document original sont encadrés par [SURLIGNÉ]...[/SURLIGNÉ]. Extrais les informations suivantes et retourne-les au format JSON STRICT (pas de texte avant ou après le JSON) :

{
  "nom": "NOM de l'élève en MAJUSCULES",
  "prenom": "Prénom de l'élève",
  "dateNaissance": "Date de naissance au format DD/MM/YYYY",
  "classe": "Classe de l'élève (ex: CE1, CM2, 6ème...)",
  "etablissementNom": "Nom de l'établissement scolaire",
  "etablissementAdresse": "Adresse complète de l'établissement",
  "etablissementEmail": "Email de l'établissement",
  "etablissementTel": "Téléphone de l'établissement",
  "origineSaisine": "IEN ou Chef établissement ou DSDEN ou Autre",
  "origineNom": "Juste le nom de la personne, ex: Mme Marquette",
  "dateDemande": "DD/MM/YYYY ou null",
  "demandes": []
}

RÈGLES STRICTES :

1. ORIGINE DE LA SAISINE :
   Le document a une section "Origine de la demande" avec 4 lignes possibles :
   - "L'IEN : [nom]"
   - "Le Chef d'établissement : [nom]"
   - "DSDEN : [nom]"
   - "Autres (ASE,...) : [nom]"
   La ligne qui a un nom de personne écrit à côté indique le type ET le nom.
   Exemple : "L'IEN :Mme Marquette" → origineSaisine="IEN", origineNom="Mme Marquette"
   Exemple : "Le Chef d'établissement : M. Dupont" → origineSaisine="Chef établissement", origineNom="M. Dupont"
   Pour "origineNom" : retourne UNIQUEMENT le nom court (ex: "Mme Marquette"), JAMAIS le texte environnant.

2. DATE DE LA DEMANDE :
   UNIQUEMENT si une date est EXPLICITEMENT écrite dans un champ "date de la demande".
   Si le champ est vide → null. Ne JAMAIS inventer de date.

3. DEMANDES - TRÈS IMPORTANT :
   Le document liste 11 types de demandes. Retourne UNIQUEMENT les demandes qui sont :
   - Surlignées : leur libellé apparaît entre [SURLIGNÉ] et [/SURLIGNÉ]
   - OU cochées avec un symbole ☑, ✓, X devant le libellé
   NE RETOURNE PAS une demande juste parce qu'elle est mentionnée dans le document.
   Si aucune demande n'est surlignée ou cochée → retourne [].
   Les codes possibles :
   SENSIBILISATION, POSTURE_PRO, GESTES_PRO, PEDAGOGIE, AMENAGEMENT,
   EXPERTISE_COMPORTEMENT, EXPERTISE_TSA_PEDAGOGIE, EXPERTISE_TSA_AESH,
   EXPERTISE_NEURODEV, COMMUNAUTE_EDUCATIVE, PARCOURS_SCOLAIRE

4. Si une information n'est pas trouvée → null

Voici le contenu du document :

---
${textContent}
---

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extraire le contenu de la réponse
    const responseText = message.content[0].text;

    // Parser le JSON
    let extractedData;
    try {
      // Nettoyer le texte (enlever les backticks markdown si présents)
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError.message);
      console.log('Réponse brute:', responseText);
      throw new Error('Impossible de parser la réponse de l\'IA');
    }

    console.log('✅ Extraction IA terminée');

    return {
      ...extractedData,
      contenuBrut: textContent,
      confidence: 'ai_extracted' // Indicateur que c'est extrait par IA
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction IA:', error.message);
    throw error;
  }
}

module.exports = {
  extractWithAI
};
