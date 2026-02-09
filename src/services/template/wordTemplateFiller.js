const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

/**
 * Remplit le template Word avec les données de la fiche
 * @param {Object} ficheData - Données de la fiche
 * @param {Object} propositionData - Données de proposition (optionnel)
 * @returns {Buffer} Buffer du document Word rempli
 */
async function fillWordTemplate(ficheData, propositionData = null) {
  console.log('📝 Remplissage du template Word...');

  try {
    // 1. Charger le template
    const templatePath = path.join(__dirname, '../../../public/templates/fiche-retour-template.docx');

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template Word non trouvé: ' + templatePath);
    }

    const content = fs.readFileSync(templatePath, 'binary');

    // 2. Créer l'instance docxtemplater
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '' // Retourner chaîne vide si valeur nulle
    });

    // 3. Préparer les données pour l'injection
    const templateData = {
      // Identification élève
      nom: ficheData.nom || '',
      prenom: ficheData.prenom || '',
      date_naissance: ficheData.date_naissance || ficheData.dateNaissance || '',
      classe: ficheData.classe || '',

      // Établissement
      etablissement_nom: ficheData.etablissement_nom || ficheData.etablissementNom || '',
      etablissement_adresse: ficheData.etablissement_adresse || ficheData.etablissementAdresse || '',
      etablissement_email: ficheData.etablissement_email || ficheData.etablissementEmail || '',
      etablissement_tel: ficheData.etablissement_tel || ficheData.etablissementTel || '',

      // Origine saisine
      origine_saisine: ficheData.origine_saisine || ficheData.origineSaisine || '',
      origine_nom: ficheData.origine_nom || ficheData.origineNom || '',
      date_demande: ficheData.date_demande || ficheData.dateDemande || '',

      // Demandes (liste formatée)
      demandes: formatDemandes(ficheData.demandes || []),

      // Demandes détectées (croix si cochée)
      // Debug : afficher les demandes utilisées pour le PDF
      ...((() => {
        const demandes = ficheData.demandes || [];
        console.log('📋 Demandes pour le PDF:', JSON.stringify(demandes));
        console.log('📋 Type de demandes:', typeof demandes, Array.isArray(demandes));
        return {};
      })()),
      d1: (ficheData.demandes || []).includes('SENSIBILISATION') ? 'X' : '',
      d2: (ficheData.demandes || []).includes('POSTURE_PRO') ? 'X' : '',
      d3: (ficheData.demandes || []).includes('GESTES_PRO') ? 'X' : '',
      d4: (ficheData.demandes || []).includes('PEDAGOGIE') ? 'X' : '',
      d5: (ficheData.demandes || []).includes('AMENAGEMENT') ? 'X' : '',
      d6: (ficheData.demandes || []).includes('EXPERTISE_COMPORTEMENT') ? 'X' : '',
      d7: (ficheData.demandes || []).includes('EXPERTISE_TSA_PEDAGOGIE') ? 'X' : '',
      d8: (ficheData.demandes || []).includes('EXPERTISE_TSA_AESH') ? 'X' : '',
      d9: (ficheData.demandes || []).includes('EXPERTISE_NEURODEV') ? 'X' : '',
      d10: (ficheData.demandes || []).includes('COMMUNAUTE_EDUCATIVE') ? 'X' : '',
      d11: (ficheData.demandes || []).includes('PARCOURS_SCOLAIRE') ? 'X' : '',

      // Temps 1 (si propositionData fourni)
      temps1_date: propositionData?.date_proposition ? formatTemps1Date(propositionData.date_proposition) : '',
      temps1_motifs: propositionData?.motifs_principaux ? formatMotifs(propositionData.motifs_principaux, ficheData.prenom, propositionData.custom_motif) : '',
      temps1_commentaire: propositionData?.commentaire || '',

      // Temps 2
      temps2_date: propositionData?.temps2_date ? formatTemps1Date(propositionData.temps2_date) : '',
      temps2_commentaire: propositionData?.temps2_commentaire || '',

      // Evaluation de la situation (croix si cochée)
      eval1: propositionData?.evaluation_situation?.includes('STABILISATION_CIRCO') ? 'X' : '',
      eval2: propositionData?.evaluation_situation?.includes('STABILISATION_PRD') ? 'X' : '',
      eval3: propositionData?.evaluation_situation?.includes('ACTIONS_COMPLEMENTAIRES') ? 'X' : '',
      eval4: propositionData?.evaluation_situation?.includes('EQUIPE_TECHNIQUE') ? 'X' : '',
      eval5: propositionData?.evaluation_situation?.includes('SITUATION_CLOTUREE') ? 'X' : ''
    };

    console.log('📊 Données à injecter:', Object.keys(templateData));

    // 4. Rendre le document
    doc.render(templateData);

    // 5. Générer le buffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    console.log('✅ Template Word rempli avec succès');

    return buf;

  } catch (error) {
    console.error('❌ Erreur lors du remplissage du template:', error.message);
    if (error.properties && error.properties.errors) {
      console.error('Détails des erreurs:', error.properties.errors);
    }
    throw error;
  }
}

/**
 * Formate la liste des demandes pour affichage
 */
function formatDemandes(demandesArray) {
  if (!Array.isArray(demandesArray) || demandesArray.length === 0) {
    return '';
  }

  const libelleMap = {
    'SENSIBILISATION': 'Demande de sensibilisation, formation aux équipes',
    'POSTURE_PRO': 'Posture professionnelle',
    'GESTES_PRO': 'Gestes professionnels',
    'PEDAGOGIE': 'Pédagogie auprès des élèves',
    'AMENAGEMENT': 'Aménagement de l\'espace classe',
    'EXPERTISE_COMPORTEMENT': 'Expertise troubles du comportement',
    'EXPERTISE_TSA_PEDAGOGIE': 'Expertise TSA apports pédagogiques',
    'EXPERTISE_TSA_AESH': 'Expertise TSA accompagnement AESH',
    'EXPERTISE_NEURODEV': 'Expertise trouble neurodév.',
    'COMMUNAUTE_EDUCATIVE': 'Appui et conseil à la communauté éducative',
    'PARCOURS_SCOLAIRE': 'Aide à l\'élaboration du parcours scolaire et/ou de soin'
  };

  return demandesArray
    .map(code => `• ${libelleMap[code] || code}`)
    .join('\n');
}

/**
 * Retourne "d'Prénom" si voyelle/h, "de Prénom" sinon
 */
function dePrenom(prenom) {
  if (!prenom) return '';
  const voyelles = 'aeiouyéèêëâîôûùüh';
  const firstChar = prenom.charAt(0).toLowerCase();
  if (voyelles.includes(firstChar)) {
    return `d'${prenom}`;
  }
  return `de ${prenom}`;
}

/**
 * Formate la liste des motifs principaux avec injection du prénom
 */
function formatMotifs(motifsArray, prenom, customMotif) {
  if (!Array.isArray(motifsArray) || motifsArray.length === 0) {
    return '';
  }

  const prenomFormate = dePrenom(prenom);

  const libelleMap = {
    'CHOIX_1': "Le PRD propose le soutien de l'Équipe Mobile d'appui à la scolarité, EMAS33, pour répondre aux besoins de conseils à la communauté éducative afin d'accompagner la prise en charge des besoins éducatifs particuliers {prenom_enfant}. L'EMAS prendra contact avec l'établissement pour déterminer les modalités d'action.",
    'CHOIX_2': "Le PRD propose le soutien de l'Equipe Mobile d'appui à la scolarité pour accompagner la communauté éducative dans l'élaboration de stratégies éducatives et comportementales adaptées aux besoins {prenom_enfant}. L'EMAS prendra contact avec l'équipe pour déterminer les modalités d'action.",
    'CHOIX_3': "Le PRD propose la visite de Madame Claire MAYOR TANNIERE, Professeure ressource TSA SDEI, qui prendra contact avec l'équipe éducative pour déterminer les modalités de sa première visite.",
    'CHOIX_4': "Le PRD propose la visite de Madame Campagne, Professeure ressource TND  SDEI, qui prendra contact avec l'équipe éducative pour déterminer les modalités de sa première visite.",
    'CHOIX_5': "Après étude de la situation {prenom_enfant}, le PRD propose un accompagnement conjoint, associant l'expertise du professeur ressource TND et l'accompagnement de l'EMAS. L'EMAS, en lien avec Mme Campagne ( PR TND ), prendra directement contact avec l'école.",
    'CHOIX_6': "Le PRD propose la visite d'CPD du  SDEI, qui prendra contact avec l'équipe éducative pour déterminer les modalités de sa première visite.",
    'CHOIX_7': "Après étude de la situation {prenom_enfant}, le PRD propose un accompagnement conjoint, associant l'expertise d'un CPD du SDEI et l'accompagnement de l'EMAS. L'EMAS, en lien avec avec  le cpd du SDEI prendra directement contact avec l'école.",
    'CHOIX_8': "Afin d'accompagner au mieux la situation {prenom_enfant}. le prd propose un accompagnement par le pole TSA / TND avec l'appui de l'EMAS qui sera à même d'intervenir rapidement. L' équipe de l'EMAS prendra contact avec l'école, tout comme le pole TSA / TND.",
    'CHOIX_9': "Afin d'accélerer la demande de prise en charge en ESMS, le PRD propose la rédaction d'une fiche RAPT ( réponse accompagnée pour tous ) par l'enseignant référent du secteur à destination de l'IEN SDEI.",
    'CHOIX_10': "Afin d'accompagner au mieux la situation {prenom_enfant} le prd propose un accompagnement de l'AESH par l'AESH référente TSA, Mme Caboblanco, qui prendra contact avec l'école et l'AESH afin de définir des modalités d'intervention."
  };

  return motifsArray
    .map(code => {
      if (code === 'CHOIX_11') {
        return customMotif || '';
      }
      const texte = (libelleMap[code] || code).replace(/\{prenom_enfant\}/g, prenomFormate);
      return texte;
    })
    .filter(line => line !== '')
    .join('\n');
}

/**
 * Formate la date pour Temps 1 : "DD/MM/YYYY"
 * (Le préfixe "Temps 1, le" est déjà dans le template)
 */
function formatTemps1Date(dateStr) {
  if (!dateStr) return '';

  // dateStr peut être au format YYYY-MM-DD ou DD/MM/YYYY
  let date;

  if (dateStr.includes('-')) {
    // Format YYYY-MM-DD
    date = new Date(dateStr);
  } else {
    // Format DD/MM/YYYY
    const [day, month, year] = dateStr.split('/');
    date = new Date(year, month - 1, day);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

module.exports = {
  fillWordTemplate
};
