-- Table principale des fiches
CREATE TABLE IF NOT EXISTS fiches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Métadonnées fichier source
  source_filename VARCHAR(255) NOT NULL,
  source_type VARCHAR(10) NOT NULL,        -- 'pdf' ou 'docx'
  source_path VARCHAR(500),

  -- Données extraites de l'élève
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE,
  classe VARCHAR(50),

  -- Établissement (informations complètes)
  etablissement_nom VARCHAR(200),
  etablissement_adresse VARCHAR(500),
  etablissement_email VARCHAR(200),
  etablissement_tel VARCHAR(20),

  -- Informations de saisine
  origine_saisine VARCHAR(50),             -- 'IEN', 'Chef établissement', 'DSDEN', 'Autre'
  origine_nom VARCHAR(200),                -- Ex: "Mme Marie-Noëlle CHRISTOPHE"
  situation_remontee_par VARCHAR(200),
  date_demande DATE,
  demandes_formulees TEXT,                 -- JSON array
  contenu_brut TEXT,                       -- Contenu complet extrait

  -- PDF généré
  pdf_output_path VARCHAR(500),

  -- Statuts
  status VARCHAR(20) DEFAULT 'pending',    -- pending, validated, completed, error

  -- Audit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

-- Table des types de demandes (référentiel)
CREATE TABLE IF NOT EXISTS types_demande (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  libelle VARCHAR(200) NOT NULL
);

-- Données pré-remplies
INSERT OR IGNORE INTO types_demande (code, libelle) VALUES
  ('TSA', 'Trouble du Spectre Autistique'),
  ('TROUBLE_COMPORTEMENT', 'Troubles du comportement'),
  ('AESH', 'Accompagnement AESH'),
  ('TDL', 'Trouble du Développement du Langage'),
  ('TROUBLE_NEURODEV', 'Troubles neurodéveloppementaux'),
  ('AMENAGEMENT_ESPACE', 'Aménagement de l''espace classe'),
  ('GESTES_PROFESSIONNELS', 'Gestes professionnels'),
  ('PEDAGOGIE', 'Pédagogie auprès des élèves');

-- Relation many-to-many
CREATE TABLE IF NOT EXISTS fiche_demandes (
  fiche_id INTEGER,
  demande_id INTEGER,
  FOREIGN KEY (fiche_id) REFERENCES fiches(id) ON DELETE CASCADE,
  FOREIGN KEY (demande_id) REFERENCES types_demande(id),
  PRIMARY KEY (fiche_id, demande_id)
);

-- Table des propositions PRD (Temps 1, Temps 2)
CREATE TABLE IF NOT EXISTS propositions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fiche_id INTEGER NOT NULL,
  temps INTEGER,                           -- 1 ou 2 (Temps 1, Temps 2)
  date_proposition DATE NOT NULL,
  motifs_principaux TEXT,                  -- JSON array des motifs sélectionnés
  commentaire TEXT,                        -- Commentaire libre de l'utilisateur
  temps2_date TEXT,                        -- Date proposition Temps 2
  temps2_commentaire TEXT,                 -- Commentaire libre Temps 2
  FOREIGN KEY (fiche_id) REFERENCES fiches(id) ON DELETE CASCADE
);

-- Table des motifs principaux (référentiel pour Temps 1/2)
CREATE TABLE IF NOT EXISTS motifs_principaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  ordre INTEGER                            -- Ordre d'affichage
);

-- Les 10 choix PRD (les libellés complets avec {prenom_enfant} sont gérés dans le code)
INSERT OR IGNORE INTO motifs_principaux (code, libelle, ordre) VALUES
  ('CHOIX_1', 'Soutien EMAS33 - conseils communauté éducative', 1),
  ('CHOIX_2', 'Soutien EMAS - stratégies éducatives et comportementales', 2),
  ('CHOIX_3', 'Visite PR TSA - Mme MAYOR TANNIERE', 3),
  ('CHOIX_4', 'Visite PR TND - Mme Campagne', 4),
  ('CHOIX_5', 'Accompagnement conjoint PR TND + EMAS', 5),
  ('CHOIX_6', 'Visite CPD du SDEI', 6),
  ('CHOIX_7', 'Accompagnement conjoint CPD SDEI + EMAS', 7),
  ('CHOIX_8', 'Accompagnement pôle TSA/TND + EMAS', 8),
  ('CHOIX_9', 'Rédaction fiche RAPT - prise en charge ESMS', 9),
  ('CHOIX_10', 'Accompagnement AESH par AESH référente TSA', 10);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_fiches_status ON fiches(status);
CREATE INDEX IF NOT EXISTS idx_fiches_created_at ON fiches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_propositions_fiche ON propositions(fiche_id);
