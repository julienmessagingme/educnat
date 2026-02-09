# PRD Automation

Application web pour automatiser les fiches de saisine PRD (Education Nationale).

## Deployment

- **Production** : https://educnat.messagingme.app
- **VPS** : ubuntu@146.59.233.252 - `/home/ubuntu/educnat/`
- **Docker** : conteneur `educnat-app`, port 3005, Nginx Proxy Manager + SSL
- **GitHub** : https://github.com/julienmessagingme/educnat
- **Local** : http://localhost:3000 (backend) / http://localhost:5173 (vite dev)

## Stack

- **Backend** : Node.js + Express + sql.js (SQLite in-memory, sauvé sur disque)
- **Frontend** : Vue.js 3 (Composition API) + Vite + Axios
- **Extraction** : Claude API (claude-3-5-haiku) + parsing XML Word (surlignage)
- **PDF** : docxtemplater (remplissage template .docx) + LibreOffice headless (conversion PDF)
- **Auth** : 2 users hardcodés (SHA-256), tokens en mémoire

## Workflow utilisateur

```
Upload Word/PDF → Extraction IA → Validation manuelle → Formulaire Temps 1/2 → PDF
```

1. **FileUpload.vue** : upload fichier → `POST /api/upload` → extraction wordExtractor + aiExtractor
2. **DataValidation.vue** : édition données extraites → `PUT /api/fiches/:id/validate`
3. **PropositionForm.vue** : Temps 1 (date, 10 motifs PRD, commentaire) + Temps 2 (évaluation, date, commentaire) → `POST /api/propositions`
4. **PDFPreview.vue** : iframe + téléchargement → `GET /api/fiches/:id/pdf?token=...`

## Structure clé

```
src/
  server.js                           # Express, routes, auth middleware
  routes/auth.js                      # POST /login, /logout, requireAuth middleware
  routes/upload.js                    # Upload + extraction
  routes/fiches.js                    # CRUD fiches
  routes/pdf.js                       # Génération + affichage PDF
  routes/propositions.js              # CRUD propositions
  services/extraction/wordExtractor.js  # Parse XML Word, détecte [SURLIGNÉ], demandes, origine
  services/extraction/aiExtractor.js    # Prompt Claude pour extraction structurée
  services/template/wordTemplateFiller.js  # Injecte données dans template Word
  services/pdf/pdfGenerator.js        # LibreOffice --headless --convert-to pdf
  db/database.js                      # Wrapper sql.js (API compatible better-sqlite3)
  db/init.js                          # Schéma + migrations auto au démarrage
  db/schema.sql                       # Tables: fiches, propositions, types_demande, motifs_principaux
  utils/validators.js                 # Zod: ficheSchema, propositionSchema
  models/Fiche.js                     # CRUD model
client/src/
  App.vue                             # Login gate + navigation tabs + workflow
  components/Login.vue                # Email/password → token localStorage
  components/FileUpload.vue           # Drag-drop upload
  components/DataValidation.vue       # Formulaire validation données
  components/PropositionForm.vue      # 10 choix PRD + Temps 2
  components/PDFPreview.vue           # iframe PDF + download
  components/FichesList.vue           # Historique + purge
  services/api.js                     # Axios + intercepteur token Bearer
public/templates/fiche-retour-template.docx  # Template Word avec placeholders
```

## BDD (SQLite via sql.js)

**fiches** : nom, prenom, date_naissance, classe, etablissement_*, origine_*, demandes_formulees (JSON), status (pending→validated→completed), pdf_output_path

**propositions** : fiche_id, temps, date_proposition, motifs_principaux (JSON), evaluation_situation (JSON), commentaire, temps2_date, temps2_commentaire

**Attention** : sql.js charge toute la BDD en mémoire au démarrage. `saveDatabase()` écrit sur disque après chaque write. Les migrations sont dans `init.js` (ALTER TABLE avec try/catch).

## Placeholders du template Word

Eleve: `{nom}`, `{prenom}`, `{date_naissance}`, `{classe}`
Etablissement: `{etablissement_nom}`, `{etablissement_adresse}`, `{etablissement_email}`, `{etablissement_tel}`
Origine: `{origine_saisine}`, `{origine_nom}`, `{date_demande}`
Demandes (X si cochée): `{d1}`..`{d11}`
Temps 1: `{temps1_date}`, `{temps1_motifs}`, `{temps1_commentaire}`
Temps 2: `{temps2_date}`, `{temps2_commentaire}`
Evaluation (X si cochée): `{eval1}`..`{eval5}`

## Les 10 choix PRD (PropositionForm + wordTemplateFiller)

Codes CHOIX_1 à CHOIX_10. Contiennent `{prenom_enfant}` remplacé par `de Lalita` ou `d'Arthur` selon voyelle/consonne (fonction `dePrenom()`). Définis en dur dans le frontend ET le backend.

## Auth

2 users dans `src/routes/auth.js` (SHA-256 hashés). Token random en mémoire (Set). Le middleware `requireAuth` vérifie header `Authorization: Bearer <token>` OU query param `?token=` (pour iframe PDF).

## Extraction Word (wordExtractor.js)

1. Parse `word/document.xml` du .docx via PizZip
2. Détecte `<w:highlight>` et `<w:shd>` → marque avec `[SURLIGNÉ]...[/SURLIGNÉ]`
3. Coupe le surlignage à chaque saut de ligne (1 demande = 1 bloc)
4. `detecterDemandesSurlignees()` : match les 11 codes via mots-clés
5. `detecterOrigine()` : cherche pattern "L'IEN : Mme Nom" ligne par ligne
6. L'IA extrait le reste (nom, prenom, etablissement, etc.)
7. Les demandes détectées par le code REMPLACENT celles de l'IA

## Commandes disponibles

- `/push` : commit + push GitHub
- `/deploy` : commit + push + déploiement VPS via SSH

## Conventions

- camelCase côté frontend, snake_case côté BDD
- Zod pour validation (accepte chaînes vides avec `.or(z.literal(''))`)
- Pas de process.exit() dans init.js (le serveur doit survivre aux erreurs d'init)
- Migrations dans init.js avec try/catch (ALTER TABLE idempotent)
- LibreOffice : Windows `C:\Program Files\LibreOffice\program\soffice.exe`, Linux `/usr/bin/libreoffice`
