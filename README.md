# 📋 PRD Automation

Application web pour automatiser le traitement des fiches de saisine PRD (Pôle Ressources Départemental) de l'Éducation Nationale.

## 🎯 Fonctionnalités

- **Upload intelligent** : Déposez un fichier Word ou PDF
- **Extraction IA** : Claude AI extrait automatiquement les données
- **Validation humaine** : Formulaire pré-rempli modifiable
- **Historique** : Consultation et gestion des fiches traitées
- **Génération PDF** : (À venir) Génération automatique du PDF de retour

## 🚀 Démarrage rapide

### Prérequis

- **Node.js 18+** : [Télécharger Node.js](https://nodejs.org/)
- **Clé API Claude** : [Obtenir une clé API](https://console.anthropic.com/)

### Installation

```bash
# 1. Aller dans le dossier du projet
cd prd-automation

# 2. Installer les dépendances backend
npm install

# 3. Installer les dépendances frontend
cd client
npm install
cd ..

# 4. Configurer les variables d'environnement
# Copier .env.example vers .env et remplir ANTHROPIC_API_KEY
```

### Configuration

Éditer le fichier `.env` :

```env
# OBLIGATOIRE : Remplir votre clé API Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Le reste peut rester par défaut
PORT=3000
DATABASE_PATH=./data/prd.db
```

### Initialisation de la base de données

```bash
npm run init-db
```

### Lancement

#### Option 1 : Mode développement (2 terminaux)

Terminal 1 - Backend :
```bash
npm run dev
```

Terminal 2 - Frontend :
```bash
cd client
npm run dev
```

Frontend accessible sur : http://localhost:5173

#### Option 2 : Mode production

```bash
# 1. Build du frontend
cd client
npm run build
cd ..

# 2. Démarrer le serveur
npm start
```

Application accessible sur : http://localhost:3000

## 📖 Utilisation

### 1. Upload d'un fichier

- Aller sur l'onglet **Upload**
- Glisser-déposer un fichier Word (.docx) ou PDF
- Cliquer sur "Analyser avec l'IA"
- ⏳ L'IA Claude extrait automatiquement les données

### 2. Validation des données

- Vérifier les champs pré-remplis par l'IA
- ✏️ Corriger si nécessaire
- Cocher les demandes concernées
- Cliquer sur "Valider et enregistrer"

### 3. Historique

- Onglet **Historique** : voir toutes les fiches
- 🔍 Rechercher par nom, prénom, fichier
- Filtrer par statut
- 👁️ Voir les détails d'une fiche
- 🗑️ Supprimer une fiche

## 🏗️ Structure du projet

```
prd-automation/
├── src/                          # Backend Node.js/Express
│   ├── server.js                 # Serveur principal
│   ├── db/                       # Base de données SQLite
│   ├── services/                 # Services métier
│   │   └── extraction/           # Extraction IA
│   │       ├── aiExtractor.js    # Extraction avec Claude API
│   │       ├── wordExtractor.js  # Extraction Word
│   │       └── pdfExtractor.js   # Extraction PDF
│   ├── routes/                   # Routes API
│   ├── models/                   # Modèles de données
│   └── utils/                    # Utilitaires
├── client/                       # Frontend Vue.js 3
│   ├── src/
│   │   ├── App.vue              # Composant principal
│   │   ├── components/          # Composants Vue
│   │   │   ├── FileUpload.vue   # Upload fichier
│   │   │   ├── DataValidation.vue # Formulaire validation
│   │   │   └── FichesList.vue   # Liste historique
│   │   └── services/
│   │       └── api.js           # Client API
│   └── dist/                    # Build de production
├── data/                        # Base de données SQLite
├── uploads/                     # Fichiers uploadés
└── output/                      # PDFs générés (à venir)
```

## 🔑 API Endpoints

### Upload
- `POST /api/upload` - Upload et extraction d'un fichier

### Fiches
- `GET /api/fiches` - Liste paginée des fiches
- `GET /api/fiches/:id` - Détails d'une fiche
- `PUT /api/fiches/:id/validate` - Valider une fiche
- `DELETE /api/fiches/:id` - Supprimer une fiche

### Référentiel
- `GET /api/fiches/reference/types-demande` - Types de demandes disponibles

## 🧪 Tests

### Test manuel complet

1. Préparer un fichier Word de test (ex: `Fiche de saisine PRD JAULIN Lalita(7).docx`)
2. Lancer l'application en mode dev
3. Uploader le fichier
4. Vérifier que l'IA a bien extrait :
   - Nom : JAULIN
   - Prénom : Lalita
   - Date de naissance : 09/07/2018
   - Établissement : Hector Ducamp
   - Etc.
5. Corriger si nécessaire
6. Valider
7. Vérifier dans l'historique

## 📝 Données extraites

L'IA Claude extrait automatiquement :

### Élève
- Nom
- Prénom
- Date de naissance
- Classe

### Établissement
- Nom
- Adresse complète
- Email
- Téléphone

### Saisine
- Type d'origine (IEN / Chef établissement / DSDEN / Autre)
- Nom de la personne
- Date de la demande

### Demandes détectées
- TSA (Trouble du Spectre Autistique)
- Troubles du comportement
- AESH
- TDL (Trouble du Développement du Langage)
- Troubles neurodéveloppementaux
- Aménagement de l'espace classe
- Gestes professionnels
- Pédagogie

## ⚙️ Technologies utilisées

### Backend
- **Node.js** + **Express** - Serveur web
- **Claude API (@anthropic-ai/sdk)** - Extraction intelligente des données
- **better-sqlite3** - Base de données SQLite
- **mammoth** - Extraction Word
- **pdf-parse** - Extraction PDF
- **multer** - Upload de fichiers
- **zod** - Validation des données

### Frontend
- **Vue.js 3** - Framework frontend
- **Vite** - Build tool
- **Axios** - Client HTTP

## 🔐 Sécurité

- ✅ Validation des types de fichiers (PDF et DOCX uniquement)
- ✅ Limite de taille : 10 MB
- ✅ Rate limiting : 10 uploads / 15 minutes
- ✅ Validation des données avec Zod
- ✅ Headers sécurité (Helmet.js)
- ✅ Stockage sécurisé des fichiers

## 🐛 Problèmes connus

### "ANTHROPIC_API_KEY non définie"
➡️ Solution : Remplir la clé API dans le fichier `.env`

### Erreur de connexion à l'API Claude
➡️ Vérifier :
- La clé API est valide
- Vous avez des crédits sur votre compte Anthropic
- Votre connexion internet fonctionne

### Frontend non accessible
➡️ Vérifier :
- Avoir buildé le frontend : `cd client && npm run build`
- Ou lancer en mode dev dans 2 terminaux séparés

## 📚 Prochaines étapes (À implémenter)

- [ ] **Phase 2** : Génération du PDF de retour de saisine
  - Service de remplissage du template Word avec docxtemplater
  - Conversion Word → PDF avec LibreOffice headless
  - Téléchargement du PDF généré

- [ ] **Phase 3** : Propositions PRD (Temps 1 et Temps 2)
  - Formulaire Temps 1/2 (date, motifs, commentaire)
  - Stockage en base
  - Injection dans le PDF

- [ ] **Phase 4** : Déploiement
  - Dockerisation
  - Configuration Nginx
  - Déploiement VPS

## 📞 Support

Pour toute question ou problème, consulter :
- Le plan d'implémentation complet
- Les logs dans `logs/combined.log` et `logs/error.log`

## 📄 Licence

Usage interne Éducation Nationale
