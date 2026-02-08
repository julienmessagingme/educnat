# 📋 PRD Automation - Documentation Claude

## 🎯 Vue d'ensemble

Application web pour automatiser le traitement des fiches de saisine PRD (Pôle Ressources Départemental) de l'Éducation Nationale.

**Workflow complet :**
```
Fichier source (Word/PDF)
  → Extraction IA (Claude API)
  → Validation manuelle
  → Formulaire Temps 1 (propositions PRD)
  → Remplissage template Word (docxtemplater)
  → Conversion PDF (LibreOffice headless)
  → Visualisation + Téléchargement
```

## 🏗️ Stack Technique

### Backend
- **Node.js** + **Express.js**
- **better-sqlite3** (base de données locale)
- **Claude API** (extraction IA via @anthropic-ai/sdk)
- **mammoth** (conversion Word → HTML pour extraction)
- **docxtemplater** (remplissage template Word)
- **LibreOffice headless** (conversion Word → PDF)
- **multer** (upload fichiers)
- **zod** (validation)

### Frontend
- **Vue.js 3** (Composition API) + **Vite**
- **axios** (requêtes HTTP)

## 📁 Structure du Projet

```
prd-automation/
├── src/
│   ├── server.js                      # Point d'entrée Express
│   ├── config/
│   │   └── upload.js                  # Config Multer
│   ├── db/
│   │   ├── database.js                # Wrapper better-sqlite3
│   │   ├── schema.sql                 # Schéma SQLite
│   │   ├── init.js                    # Initialisation BDD
│   │   ├── migrate.js                 # Script de migration
│   │   └── update_demandes.js         # MAJ des types de demandes
│   ├── services/
│   │   ├── extraction/
│   │   │   ├── wordExtractor.js       # Extraction Word (mammoth)
│   │   │   ├── pdfExtractor.js        # Extraction PDF (pdf-parse)
│   │   │   └── aiExtractor.js         # Extraction IA (Claude API)
│   │   ├── template/
│   │   │   └── wordTemplateFiller.js  # Injection données (docxtemplater)
│   │   └── pdf/
│   │       └── pdfGenerator.js        # Génération PDF (LibreOffice)
│   ├── routes/
│   │   ├── upload.js                  # POST /api/upload
│   │   ├── fiches.js                  # CRUD fiches
│   │   ├── pdf.js                     # GET /api/fiches/:id/pdf
│   │   └── propositions.js            # CRUD propositions
│   ├── models/
│   │   └── Fiche.js                   # Modèle Fiche
│   └── utils/
│       ├── logger.js                  # Winston
│       └── validators.js              # Schémas Zod
├── public/
│   └── templates/
│       └── fiche-retour-template.docx # Template Word avec placeholders
├── client/                            # Frontend Vue.js
│   ├── src/
│   │   ├── App.vue                    # Composant principal
│   │   ├── main.js
│   │   ├── components/
│   │   │   ├── FileUpload.vue         # Upload fichier
│   │   │   ├── DataValidation.vue     # Validation données
│   │   │   ├── PropositionForm.vue    # Formulaire Temps 1
│   │   │   ├── PDFPreview.vue         # Prévisualisation PDF
│   │   │   └── FichesList.vue         # Liste historique
│   │   └── services/
│   │       └── api.js                 # Axios wrapper
│   └── vite.config.js
├── uploads/                           # Fichiers uploadés
├── output/                            # PDFs générés
├── data/                              # Base SQLite
└── logs/                              # Logs Winston
```

## 🗄️ Base de Données SQLite

### Tables principales

**fiches** - Stocke les fiches de saisine
- Métadonnées fichier source (filename, type, path)
- Données élève (nom, prénom, date_naissance, classe)
- Établissement (nom, adresse, email, tel)
- Origine saisine (type, nom)
- Demandes formulées (JSON array)
- PDF généré (pdf_output_path)
- Statuts (pending, validated, completed)

**propositions** - Propositions PRD (Temps 1/2)
- fiche_id, temps (1 ou 2)
- date_proposition
- motifs_principaux (JSON array)
- evaluation_situation (JSON array) ← **AJOUTÉ**
- commentaire

**types_demande** - Référentiel des 11 types de demandes
**motifs_principaux** - Référentiel des motifs (7 choix)

## 🔑 Placeholders du Template Word

Le fichier `public/templates/fiche-retour-template.docx` contient ces placeholders :

### Identification élève
- `{nom}` - Nom en MAJUSCULES
- `{prenom}` - Prénom
- `{date_naissance}` - Format DD/MM/YYYY
- `{classe}` - Classe (ex: CE1)

### Établissement
- `{etablissement_nom}`
- `{etablissement_adresse}`
- `{etablissement_email}`
- `{etablissement_tel}`

### Origine saisine
- `{origine_saisine}` - Type (IEN, Chef établissement, DSDEN, Autre)
- `{origine_nom}` - Nom de la personne
- `{date_demande}` - Date DD/MM/YYYY

### Demandes formulées (croix si cochée)
- `{d1}` - Sensibilisation, formation aux équipes
- `{d2}` - Posture professionnelle
- `{d3}` - Gestes professionnels
- `{d4}` - Pédagogie auprès des élèves
- `{d5}` - Aménagement de l'espace classe
- `{d6}` - Expertise troubles du comportement
- `{d7}` - Expertise TSA apports pédagogiques
- `{d8}` - Expertise TSA accompagnement AESH
- `{d9}` - Expertise trouble neurodév.
- `{d10}` - Appui communauté éducative
- `{d11}` - Parcours scolaire/soin

### Temps 1 - Propositions PRD
- `{temps1_date}` - Date au format DD/MM/YYYY
- `{temps1_motifs}` - Liste des motifs sélectionnés
- `{temps1_commentaire}` - Commentaire libre

### Évaluation de la situation (croix si cochée)
- `{eval1}` - Stabilisation suivi circonscription
- `{eval2}` - Stabilisation suivi PRD
- `{eval3}` - Actions complémentaires
- `{eval4}` - Equipe technique
- `{eval5}` - Situation clôturée

## 📝 Suivi des Modifications Récentes

### 2026-02-07 - Session complète

#### ✅ Corrections bugs critiques
1. **Erreur syntaxe pdfGenerator.js** - Variable `db` déclarée 2 fois (ligne 185) → Supprimé duplication
2. **Port 3000 déjà utilisé** - Processus zombie tué avant chaque redémarrage
3. **PDF vide et format non respecté** - Remplacé mammoth+puppeteer par **LibreOffice headless**

#### ✅ Fonctionnalités ajoutées

**1. Affichage PDF dans iframe**
- Modifié route GET /api/fiches/:id/pdf pour afficher inline (au lieu de forcer téléchargement)
- Ajout query param `?download=true` pour télécharger
- Frontend : iframe affiche le PDF directement

**2. Boutons "Revenir en arrière"**
- PropositionForm : retour vers DataValidation
- PDFPreview : retour vers PropositionForm
- Gestion des événements `@back` dans App.vue

**3. Purge de l'historique**
- Bouton "🗑️ Purger l'historique" dans FichesList
- Double confirmation avant suppression
- Route DELETE /api/fiches (sans ID) pour tout supprimer
- Supprime fiches + fichiers (source + PDF)

**4. Évaluation de la situation** ⭐ NOUVEAU
- Ajout section dans PropositionForm (5 choix multiples)
- Champ `evaluation_situation` ajouté à table propositions
- Placeholders `{eval1}` à `{eval5}` dans template
- Croix "X" apparaissent pour choix cochés

**5. Détection des 11 demandes** ⭐ NOUVEAU
- Mise à jour de la liste des demandes (8 → 11 types)
- Amélioration prompt IA pour détecter cases cochées + surlignage
- Placeholders `{d1}` à `{d11}` dans template
- Codes mis à jour : SENSIBILISATION, POSTURE_PRO, GESTES_PRO, etc.

#### ✅ Corrections validation
- Validateur Zod : email plus permissif (accepte chaîne vide)
- Ajout `evaluationSituation` dans propositionSchema

#### 🔧 Configuration LibreOffice
- Chemin Windows : `C:\Program Files\LibreOffice\program\soffice.exe`
- Variable d'env : `LIBREOFFICE_PATH` (optionnel)
- Conversion en mode headless : `--headless --convert-to pdf`

## 🚀 Commandes Utiles

### Démarrage en localhost
```bash
# Backend
cd C:\users\julie\educnat\prd-automation
node src/server.js

# Frontend (build)
cd client
npm run build

# Frontend (dev)
cd client
npm run dev
```

### Accès
- Application : http://localhost:3000
- API : http://localhost:3000/api
- Health check : http://localhost:3000/health

### Base de données
```bash
# Initialiser la BDD
node src/db/init.js

# Migrer (ajouter evaluation_situation)
node src/db/migrate.js

# Mettre à jour les demandes (11 types)
node src/db/update_demandes.js
```

### Tuer le serveur (Windows)
```bash
netstat -ano | grep :3000 | grep LISTENING
taskkill //F //PID <PID>
```

## ⚠️ Points Importants

### 1. LibreOffice est OBLIGATOIRE
- Doit être installé sur le système (localhost + VPS)
- Windows : `C:\Program Files\LibreOffice\program\soffice.exe`
- Linux/VPS : `libreoffice` via apt/apk
- Docker : `RUN apk add --no-cache libreoffice ttf-dejavu fontconfig`

### 2. Template Word
- Fichier : `public/templates/fiche-retour-template.docx`
- **NE PAS remplacer par HTML** - docxtemplater nécessite .docx
- Tous les placeholders doivent être entre `{}`
- Format A4 préservé par LibreOffice

### 3. Extraction IA
- Nécessite `ANTHROPIC_API_KEY` en variable d'environnement
- Modèle : claude-3-haiku-20240307
- Détecte automatiquement demandes cochées/surlignées
- Coût : ~0.25$ / 1M tokens input, ~1.25$ / 1M tokens output

### 4. Workflow utilisateur
1. Upload fichier Word/PDF
2. Validation données extraites (éditable)
3. Formulaire Temps 1 :
   - Date proposition
   - Motifs principaux (choix multiple)
   - Évaluation situation (choix multiple) ← NOUVEAU
   - Commentaire libre
4. Génération PDF automatique
5. Prévisualisation + Téléchargement

## 🐛 Problèmes Connus & Solutions

### 1. "Données invalides" après upload
**Cause :** Validateur Zod rejette les données
**Solution :** Vérifier validators.js, assouplir les contraintes si besoin

### 2. PDF vide ou mal formaté
**Cause :** LibreOffice pas installé ou template sans placeholders
**Solution :** Vérifier installation LibreOffice + placeholders template

### 3. Port 3000 déjà utilisé
**Cause :** Serveur Node zombie
**Solution :** `netstat -ano | grep :3000` puis `taskkill //F //PID <PID>`

### 4. Erreur "Assertion failed: UV_HANDLE_CLOSING"
**Cause :** Bug better-sqlite3 à la fermeture
**Solution :** Ignorer, ne bloque pas le fonctionnement

## 📋 TODOs / Améliorations Futures

### Priorité haute
- [ ] Tester la détection des 11 demandes avec fichiers réels
- [ ] Vérifier que les croix s'affichent correctement dans le PDF
- [ ] Valider le format A4 du PDF généré

### Priorité moyenne
- [ ] Ajouter gestion Temps 2 (propositions de suivi)
- [ ] Export Excel de l'historique
- [ ] Recherche avancée dans l'historique
- [ ] Notifications par email lors de la génération PDF

### Priorité basse
- [ ] Multi-utilisateurs avec authentification
- [ ] Tableau de bord statistiques
- [ ] API REST documentée (Swagger)

## 🚢 Déploiement VPS (Phase 4 - À venir)

**⚠️ NE PAS déployer avant validation complète en localhost**

### Prérequis VPS
- Node.js 18+
- LibreOffice (via apt/apk)
- Nginx (reverse proxy)
- PM2 (gestion processus)
- SSL/TLS (Let's Encrypt)

### Installation LibreOffice sur VPS
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libreoffice --no-install-recommends

# Docker Alpine
RUN apk add --no-cache libreoffice ttf-dejavu fontconfig
```

### Variables d'environnement production
```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/prd.db
UPLOAD_DIR=/app/uploads
OUTPUT_DIR=/app/output
ANTHROPIC_API_KEY=sk-ant-...
LIBREOFFICE_PATH=/usr/bin/libreoffice
```

## 📞 Contact & Support

- **Utilisateur :** Julie (Éducation Nationale)
- **Projet :** PRD Automation
- **Localisation :** C:\users\julie\educnat\prd-automation

---

**Dernière mise à jour :** 2026-02-07
**Version :** 1.0.0
**Statut :** ✅ Fonctionnel en localhost
