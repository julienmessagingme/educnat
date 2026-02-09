const { z } = require('zod');

const optionalText = z.string().or(z.literal('')).optional().nullable();

const analyseSchema = z.object({
  nomEnfant: optionalText,
  prenomEnfant: optionalText,
  dateDeNaissance: optionalText,
  etablissementScolaire: optionalText,
  classe: optionalText,
  problematique: optionalText,
  motif: optionalText,
  historique: optionalText,
  situation: optionalText,
  partenaires: optionalText,
  contexteFamilial: optionalText,
  difficultes: optionalText,
  pointsAppui: optionalText,
  enClasse: optionalText,
  avecLaCommunaute: optionalText,
  demandeFormulee: optionalText
});

function validateAnalyse(data) {
  return analyseSchema.parse(data);
}

module.exports = {
  validateAnalyse,
  analyseSchema
};
