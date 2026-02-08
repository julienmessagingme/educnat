const { z } = require('zod');

// Schéma de validation pour la création/mise à jour d'une fiche
const ficheSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100),
  prenom: z.string().min(1, 'Le prénom est requis').max(100),
  dateNaissance: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (DD/MM/YYYY)').or(z.literal('')).optional().nullable(),
  classe: z.string().max(50).optional().nullable(),
  etablissementNom: z.string().max(200).optional().nullable(),
  etablissementAdresse: z.string().max(500).optional().nullable(),
  etablissementEmail: z.string().email('Email invalide').or(z.literal('')).optional().nullable(),
  etablissementTel: z.string().max(20).optional().nullable(),
  origineSaisine: z.enum(['IEN', 'Chef établissement', 'DSDEN', 'Autre']).or(z.literal('')).optional().nullable(),
  origineNom: z.string().max(200).optional().nullable(),
  situationRemontee: z.string().max(200).optional().nullable(),
  dateDemande: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (DD/MM/YYYY)').or(z.literal('')).optional().nullable(),
  demandes: z.array(z.string()).optional().default([])
});

// Schéma pour les propositions (Temps 1/2)
const propositionSchema = z.object({
  ficheId: z.number().int().positive(),
  temps: z.number().int().min(1).max(2),
  dateProposition: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide'),
  motifsPrincipaux: z.array(z.string()).optional().default([]),
  evaluationSituation: z.array(z.string()).optional().default([]),
  commentaire: z.string().optional().nullable(),
  temps2Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide').or(z.literal('')).optional().nullable(),
  temps2Commentaire: z.string().optional().nullable()
});

function validateFiche(data) {
  return ficheSchema.parse(data);
}

function validateProposition(data) {
  return propositionSchema.parse(data);
}

module.exports = {
  validateFiche,
  validateProposition,
  ficheSchema,
  propositionSchema
};
