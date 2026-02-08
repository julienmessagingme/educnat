const mammoth = require('mammoth');
const PizZip = require('pizzip');
const fs = require('fs');
const { extractWithAI } = require('./aiExtractor');

/**
 * Lit le XML du .docx pour détecter les textes surlignés (highlight/shading)
 * et les marquer avec [SURLIGNÉ]...[/SURLIGNÉ]
 */
function extractHighlightedText(filePath) {
  const content = fs.readFileSync(filePath, 'binary');
  const zip = new PizZip(content);

  let documentXml;
  try {
    documentXml = zip.file('word/document.xml').asText();
  } catch {
    return null; // Pas de document.xml, fallback sur mammoth
  }

  // Trouver tous les text runs <w:r>...</w:r> avec séparation par paragraphe
  const runs = [];
  // D'abord, traiter paragraphe par paragraphe pour ajouter des sauts de ligne
  const paragraphs = documentXml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  let match;

  for (const paraXml of paragraphs) {
    // Ajouter un saut de ligne entre les paragraphes
    if (runs.length > 0) {
      runs.push({ text: '\n', highlighted: false });
    }

    const runRegex = /<w:r[ >][\s\S]*?<\/w:r>/g;
    while ((match = runRegex.exec(paraXml)) !== null) {
    const runXml = match[0];

    // Vérifier si ce run a un surlignage (highlight ou shading avec couleur)
    const hasHighlight = /<w:highlight\s+w:val="(?!none)[^"]*"/.test(runXml);
    const hasShading = /<w:shd\s[^>]*w:fill="(?!auto|FFFFFF|ffffff)[^"]*"/.test(runXml);
    const isHighlighted = hasHighlight || hasShading;

    // Extraire le texte du run
    const textParts = [];
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch;
    while ((textMatch = textRegex.exec(runXml)) !== null) {
      textParts.push(textMatch[1]);
    }

    if (textParts.length > 0) {
      runs.push({
        text: textParts.join(''),
        highlighted: isHighlighted
      });
    } else {
      // Ajouter un espace entre les runs pour éviter la concaténation
      runs.push({ text: ' ', highlighted: false });
    }
    }
  }

  // Aussi chercher les paragraphes avec surlignage au niveau paragraphe
  // (certains documents surlignent le paragraphe entier via pPr/shd)
  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
  const paragraphHighlights = new Map();

  while ((match = paraRegex.exec(documentXml)) !== null) {
    const paraXml = match[0];
    const paraHasShading = /<w:pPr>[\s\S]*?<w:shd\s[^>]*w:fill="(?!auto|FFFFFF|ffffff)[^"]*"/.test(paraXml);

    if (paraHasShading) {
      // Marquer tous les textes de ce paragraphe comme surlignés
      const paraTextRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let ptMatch;
      while ((ptMatch = paraTextRegex.exec(paraXml)) !== null) {
        paragraphHighlights.set(ptMatch[1], true);
      }
    }
  }

  // Construire le texte : marquer TOUS les passages surlignés avec [SURLIGNÉ]
  let result = '';
  let inHighlight = false;
  let highlightBuffer = '';

  for (const run of runs) {
    const isHL = run.highlighted || paragraphHighlights.has(run.text);

    // Couper le surlignage à chaque saut de ligne (chaque demande = un bloc séparé)
    if (run.text === '\n' && inHighlight) {
      if (highlightBuffer.trim().length > 0) {
        result += '[SURLIGNÉ]' + highlightBuffer + '[/SURLIGNÉ]';
      } else {
        result += highlightBuffer;
      }
      inHighlight = false;
      highlightBuffer = '';
      result += run.text;
    } else if (isHL && !inHighlight) {
      inHighlight = true;
      highlightBuffer = run.text;
    } else if (isHL && inHighlight) {
      highlightBuffer += run.text;
    } else if (!isHL && inHighlight) {
      if (highlightBuffer.trim().length > 0) {
        result += '[SURLIGNÉ]' + highlightBuffer + '[/SURLIGNÉ]';
      } else {
        result += highlightBuffer;
      }
      inHighlight = false;
      highlightBuffer = '';
      result += run.text;
    } else {
      result += run.text;
    }
  }

  // Fermer le dernier surlignage si nécessaire
  if (inHighlight) {
    if (highlightBuffer.trim().length > 0) {
      result += '[SURLIGNÉ]' + highlightBuffer + '[/SURLIGNÉ]';
    } else {
      result += highlightBuffer;
    }
  }

  return result;
}

/**
 * Détecte les demandes en matchant les passages surlignés avec les libellés connus
 */
function detecterDemandesSurlignees(text) {
  const mapping = [
    { code: 'SENSIBILISATION', mots: ['sensibilisation', 'formation aux équipes'] },
    { code: 'POSTURE_PRO', mots: ['posture professionnelle'] },
    { code: 'GESTES_PRO', mots: ['gestes professionnels'] },
    { code: 'PEDAGOGIE', mots: ['pédagogie auprès des élèves'] },
    { code: 'AMENAGEMENT', mots: ['aménagement de l\'espace classe', 'aménagement espace classe'] },
    { code: 'EXPERTISE_COMPORTEMENT', mots: ['expertise troubles du comportement', 'troubles du comportement'] },
    { code: 'EXPERTISE_TSA_PEDAGOGIE', mots: ['expertise tsa apports pédagogiques', 'tsa apports pédagogiques'] },
    { code: 'EXPERTISE_TSA_AESH', mots: ['expertise tsa accompagnement aesh', 'tsa accompagnement aesh'] },
    { code: 'EXPERTISE_NEURODEV', mots: ['expertise trouble neurodév', 'trouble neurodév'] },
    { code: 'COMMUNAUTE_EDUCATIVE', mots: ['communauté éducative'] },
    { code: 'PARCOURS_SCOLAIRE', mots: ['parcours scolaire', 'parcours de soin'] },
  ];

  const found = [];

  // 1. Détection par surlignage
  const matches = text.match(/\[SURLIGNÉ\]([\s\S]*?)\[\/SURLIGNÉ\]/g);
  if (matches) {
    for (const m of matches) {
      const texte = m.replace(/\[\/?SURLIGNÉ\]/g, '').toLowerCase().trim();
      for (const d of mapping) {
        if (d.mots.some(mot => texte.includes(mot)) && !found.includes(d.code)) {
          found.push(d.code);
          console.log(`   ✅ Demande détectée par surlignage: ${d.code}`);
        }
      }
    }
  }

  // 2. Détection par croix/coches (X, x, ✓, ✔, ☑, ☒) devant le libellé
  const texteLower = text.replace(/\[\/?SURLIGNÉ\]/g, '').toLowerCase();
  for (const d of mapping) {
    if (found.includes(d.code)) continue; // déjà trouvé par surlignage
    for (const mot of d.mots) {
      // Chercher un symbole de coche/croix juste avant le libellé (avec espaces possibles)
      const pattern = new RegExp('[xX✓✔☑☒]\\s{0,3}' + mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (pattern.test(texteLower)) {
        found.push(d.code);
        console.log(`   ✅ Demande détectée par croix: ${d.code}`);
        break;
      }
    }
  }

  return found;
}

/**
 * Détecte l'origine de la saisine (type + nom) depuis le texte
 * Cherche le pattern : "L'IEN : Mme Marquette" ou "Le Chef d'établissement : M. Dupont"
 * La ligne qui contient un nom de personne (Mme/M./Mr + Nom) à côté du type indique l'origine.
 */
function detecterOrigine(text) {
  const result = { type: null, nom: null };
  const textBrut = text.replace(/\[\/?SURLIGNÉ\]/g, '');

  // Patterns pour chaque type d'origine, capturant le nom après les deux-points
  const patterns = [
    { type: 'IEN', regex: /L[''']?\s*IEN\s*[:\-–]\s*(.+)/i },
    { type: 'Chef établissement', regex: /[Ll]e\s+[Cc]hef\s+d['''](?:é|e)tablissement\s*[:\-–]\s*(.+)/i },
    { type: 'DSDEN', regex: /DSDEN\s*[:\-–]\s*(.+)/i },
    { type: 'Autre', regex: /Autres?\s*\([^)]*\)\s*[:\-–]\s*(.+)/i },
  ];

  const lignes = textBrut.split('\n');
  for (const ligne of lignes) {
    for (const p of patterns) {
      const match = ligne.match(p.regex);
      if (match && match[1]) {
        const candidat = match[1].trim();
        // Vérifier qu'il y a un vrai nom (pas juste des espaces ou du vide)
        // Un nom contient au moins 2 caractères alphabétiques
        if (candidat.length >= 2 && /[a-zA-ZÀ-ÿ]{2,}/.test(candidat)) {
          result.type = p.type;
          // Nettoyer : garder juste le nom, couper au premier saut de ligne ou texte parasite
          result.nom = candidat
            .replace(/\s*Date\s+de\s+la\s+demande.*$/i, '')
            .replace(/\s*Le\s+Chef.*$/i, '')
            .replace(/\s*DSDEN.*$/i, '')
            .replace(/\s*Autres?\s*\(.*$/i, '')
            .replace(/\s*L[''']?\s*IEN.*$/i, '')
            .replace(/\s*Situation\s+remontée.*$/i, '')
            .replace(/\s*Identification.*$/i, '')
            .trim();
          if (result.nom) {
            console.log(`   ✅ Origine détectée: ${p.type} - ${result.nom}`);
            return result;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Extrait les données d'un fichier Word (.docx)
 * @param {string} filePath - Chemin du fichier Word
 * @returns {Promise<Object>} Données extraites
 */
async function extractFromWord(filePath) {
  console.log('📄 Extraction du fichier Word:', filePath);

  try {
    // 1. Essayer d'extraire avec détection du surlignage via XML direct
    let text = extractHighlightedText(filePath);

    if (text && text.includes('[SURLIGNÉ]')) {
      console.log('✅ Surlignage détecté dans le document');
      // Afficher les passages surlignés pour debug
      const matches = text.match(/\[SURLIGNÉ\][\s\S]*?\[\/SURLIGNÉ\]/g);
      if (matches) {
        console.log('📌 Passages surlignés trouvés:', matches.length);
        matches.forEach((m, i) => console.log(`   ${i+1}. ${m.substring(0, 120)}`));
      }
      console.log('📝 Extrait avec marqueurs, longueur:', text.length, 'caractères');
    } else {
      // Fallback : extraction classique via mammoth
      console.log('⚠️  Pas de surlignage détecté, fallback mammoth');
      const result = await mammoth.convertToHtml({ path: filePath });
      text = result.value
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log('📝 Contenu extrait via mammoth, longueur:', text.length, 'caractères');
    }

    // 2. Détecter les demandes directement depuis le surlignage (sans l'IA)
    const demandesDetectees = detecterDemandesSurlignees(text);
    console.log('📋 Demandes détectées par surlignage:', JSON.stringify(demandesDetectees));

    // 3. Détecter l'origine de la saisine depuis le surlignage/texte
    const origineDetectee = detecterOrigine(text);
    console.log('📋 Origine détectée:', JSON.stringify(origineDetectee));

    // 4. Extraction IA pour les autres champs (nom, prénom, etc.)
    const extractedData = await extractWithAI(text, 'docx');

    // 5. Remplacer les demandes de l'IA par celles détectées par le code
    if (demandesDetectees.length > 0) {
      extractedData.demandes = demandesDetectees;
    }

    // 6. Remplacer l'origine si détectée par le code
    if (origineDetectee.type) {
      extractedData.origineSaisine = origineDetectee.type;
    }
    if (origineDetectee.nom) {
      extractedData.origineNom = origineDetectee.nom;
    }

    // 7. Date de demande : ne garder QUE si elle apparaît explicitement dans le texte
    if (extractedData.dateDemande) {
      const dateStr = extractedData.dateDemande;
      const texteSansMarqueurs = text.replace(/\[\/?SURLIGNÉ\]/g, '');
      if (!texteSansMarqueurs.includes(dateStr)) {
        console.log(`   ⚠️ Date ${dateStr} inventée par l'IA, forcée à null`);
        extractedData.dateDemande = null;
      }
    }

    console.log('📋 Demandes finales:', JSON.stringify(extractedData.demandes));
    console.log('📋 Origine finale:', extractedData.origineSaisine, '-', extractedData.origineNom);
    console.log('📋 Date finale:', extractedData.dateDemande);

    return extractedData;

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction Word:', error.message);
    throw error;
  }
}

module.exports = {
  extractFromWord
};
