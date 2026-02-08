# 📝 Historique des Modifications

## [1.0.0] - 2026-02-07

### 🐛 Corrections de bugs

#### Bugs critiques
- **[pdfGenerator.js]** Erreur syntaxe : variable `db` déclarée 2 fois (ligne 185)
  - **Impact :** Serveur ne démarrait pas
  - **Solution :** Supprimé la duplication de déclaration

- **[server.js]** Port 3000 déjà utilisé lors du redémarrage
  - **Impact :** Serveur ne redémarrait pas
  - **Solution :** Script pour tuer le processus zombie avant redémarrage

- **[pdfGenerator.js]** PDF généré vide et format non respecté
  - **Cause :** Mammoth + Puppeteer écrasait les données et perdait le format
  - **Solution :** Remplacement par **LibreOffice headless**
  - **Fichiers modifiés :** `src/services/pdf/pdfGenerator.js`

#### Bugs mineurs
- **[wordTemplateFiller.js]** Date Temps 1 dupliquée ("Temps 1, le Temps 1, le...")
  - **Solution :** Retirer le préfixe "Temps 1, le" de la fonction formatTemps1Date

- **[pdf.js]** PDF force le téléchargement au lieu de s'afficher
  - **Solution :** Ajout Content-Disposition: inline + query param `?download=true`

- **[validators.js]** Validation email trop stricte
  - **Solution :** Accepter chaîne vide avec `.or(z.literal(''))`

### ✨ Nouvelles fonctionnalités

#### Navigation améliorée
- **Bouton "Revenir en arrière"** dans PropositionForm
  - Permet de revenir à DataValidation
  - Événement `@back` géré dans App.vue

- **Bouton "Revenir en arrière"** dans PDFPreview
  - Permet de revenir au formulaire Temps 1
  - Événement `@back` géré dans App.vue

#### Gestion de l'historique
- **Bouton "Purger l'historique"** dans FichesList
  - Double confirmation avant suppression
  - Route backend : DELETE /api/fiches (sans ID)
  - Supprime toutes les fiches + fichiers associés
  - Affiche le nombre de fiches supprimées

- **Affichage PDF dans iframe** au lieu du téléchargement
  - Route GET /api/fiches/:id/pdf avec Content-Disposition: inline
  - Query param `?download=true` pour forcer téléchargement
  - Composant PDFPreview affiche l'iframe

#### Évaluation de la situation ⭐
- **Nouvelle section** dans le formulaire Temps 1
  - 5 choix multiples :
    1. Stabilisation suivi circonscription
    2. Stabilisation suivi PRD
    3. Actions complémentaires
    4. Equipe technique
    5. Situation clôturée
  - Stockage dans table `propositions.evaluation_situation` (JSON array)
  - Placeholders template : `{eval1}` à `{eval5}`
  - Croix "X" apparaissent dans le PDF pour choix cochés

#### Détection des demandes améliorée ⭐
- **Mise à jour des types de demandes** : 8 → 11 types
  - Nouveaux codes :
    - SENSIBILISATION
    - POSTURE_PRO
    - GESTES_PRO
    - PEDAGOGIE
    - AMENAGEMENT
    - EXPERTISE_COMPORTEMENT
    - EXPERTISE_TSA_PEDAGOGIE
    - EXPERTISE_TSA_AESH
    - EXPERTISE_NEURODEV
    - COMMUNAUTE_EDUCATIVE
    - PARCOURS_SCOLAIRE

- **Amélioration du prompt IA** pour détecter :
  - Cases cochées (☑, ✓, X)
  - Texte surligné (jaune, rouge, etc.)

- **Placeholders template** : `{d1}` à `{d11}`
  - Croix "X" apparaissent dans le PDF pour demandes détectées

### 🗄️ Base de données

#### Migrations
- **Ajout colonne `evaluation_situation`** dans table `propositions`
  - Type : TEXT (JSON array)
  - Migration : `src/db/migrate.js`

- **Mise à jour table `types_demande`**
  - 11 nouveaux types de demandes
  - Script : `src/db/update_demandes.js`

### 🔧 Configuration

#### LibreOffice headless
- **Installation requise** sur le système
- Chemin Windows : `C:\Program Files\LibreOffice\program\soffice.exe`
- Variable d'environnement : `LIBREOFFICE_PATH` (optionnel)
- Conversion : `--headless --convert-to pdf`

#### Variables d'environnement
```env
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe
ANTHROPIC_API_KEY=sk-ant-...
```

### 📝 Documentation

#### Fichiers créés
- **CLAUDE.md** : Documentation complète du projet
  - Vue d'ensemble
  - Architecture et structure
  - Placeholders template
  - Suivi des modifications
  - Commandes utiles
  - TODOs

- **CHANGELOG.md** : Historique des modifications (ce fichier)

### 🔄 Fichiers modifiés

#### Backend
- `src/services/pdf/pdfGenerator.js` : LibreOffice au lieu de mammoth+puppeteer
- `src/services/template/wordTemplateFiller.js` : Ajout placeholders {d1}-{d11} et {eval1}-{eval5}
- `src/services/extraction/aiExtractor.js` : Prompt IA amélioré pour 11 demandes
- `src/routes/pdf.js` : Affichage inline + query param download
- `src/routes/propositions.js` : Support evaluation_situation
- `src/routes/fiches.js` : Route DELETE / pour purge
- `src/utils/validators.js` : Email permissif + evaluationSituation
- `src/db/schema.sql` : Documentation mise à jour

#### Frontend
- `client/src/components/PropositionForm.vue` : Section évaluation + bouton retour
- `client/src/components/PDFPreview.vue` : Bouton retour + lien download=true
- `client/src/components/FichesList.vue` : Bouton purge + structure header-top
- `client/src/App.vue` : Gestion événements @back
- `client/src/services/api.js` : Fonction deleteAllFiches

#### Nouveaux fichiers
- `src/db/migrate.js` : Script migration evaluation_situation
- `src/db/update_demandes.js` : Script MAJ 11 types demandes
- `src/db/migrations/add_evaluation_situation.sql` : Migration SQL
- `CLAUDE.md` : Documentation projet
- `CHANGELOG.md` : Ce fichier

### 📦 Dépendances

Aucune nouvelle dépendance ajoutée. Utilisation optimale des packages existants.

### 🧪 Tests

#### Tests manuels effectués
- ✅ Upload fichier Word
- ✅ Extraction données par IA
- ✅ Validation et correction manuelle
- ✅ Formulaire Temps 1 avec évaluation
- ✅ Génération PDF avec LibreOffice
- ✅ Affichage PDF dans iframe
- ✅ Téléchargement PDF
- ✅ Boutons "Revenir en arrière"
- ✅ Purge de l'historique
- ✅ Navigation complète du workflow

#### À tester
- [ ] Détection des 11 demandes sur fichiers réels
- [ ] Vérification des croix dans le PDF final
- [ ] Format A4 préservé dans le PDF

### 🚀 Déploiement

**Statut :** ✅ Fonctionnel en localhost
**VPS :** ⏳ En attente (Phase 4)

---

## Versions Antérieures

### [0.1.0] - 2026-02-07 (Début de session)
- Setup initial du projet
- Architecture Backend + Frontend
- Extraction IA avec Claude API
- Template Word + Génération PDF basique
- Interface Vue.js avec workflow complet

---

**Format :** [Version] - Date
**Convention :** Semantic Versioning (MAJOR.MINOR.PATCH)
