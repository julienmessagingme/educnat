const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

/**
 * Remplit le template Word de fiche d'analyse avec les données
 */
async function fillAnalyseTemplate(data) {
  console.log('📝 Remplissage du template fiche d\'analyse...');

  try {
    const templatePath = path.join(__dirname, '../../../public/templates/fiche-analyse-template.docx');

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template fiche d\'analyse non trouvé: ' + templatePath);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });

    // Map des données — le template contient {problématique} avec accent
    const templateData = {
      nom_enfant: data.nom_enfant || '',
      prenom_enfant: data.prenom_enfant || '',
      date_de_naissance: data.date_de_naissance || '',
      etablissement_scolaire: data.etablissement_scolaire || '',
      classe: data.classe || '',
      'problématique': data.problematique || '',
      motif: data.motif || '',
      historique: data.historique || '',
      situation: data.situation || '',
      partenaires: data.partenaires || '',
      contexte_familial: data.contexte_familial || '',
      difficultes: data.difficultes || '',
      points_appui: data.points_appui || '',
      en_classe: data.en_classe || '',
      avec_la_communaute: data.avec_la_communaute || '',
      demande_formulee: data.demande_formulee || ''
    };

    console.log('📊 Données à injecter:', Object.keys(templateData));

    doc.render(templateData);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    console.log('✅ Template fiche d\'analyse rempli avec succès');
    return buf;

  } catch (error) {
    console.error('❌ Erreur lors du remplissage du template analyse:', error.message);
    if (error.properties && error.properties.errors) {
      console.error('Détails des erreurs:', error.properties.errors);
    }
    throw error;
  }
}

module.exports = {
  fillAnalyseTemplate
};
