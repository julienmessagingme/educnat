# 🚀 Guide de démarrage rapide

## ✅ Installation terminée !

Votre application PRD Automation est prête à être utilisée.

## 📝 Configuration OBLIGATOIRE

Avant de démarrer, vous DEVEZ configurer votre clé API Claude :

### 1. Obtenir une clé API Claude

1. Aller sur https://console.anthropic.com/
2. Créer un compte ou se connecter
3. Aller dans **API Keys**
4. Créer une nouvelle clé API
5. Copier la clé (commence par `sk-ant-...`)

### 2. Configurer la clé API

Éditer le fichier `.env` et remplir :

```env
ANTHROPIC_API_KEY=sk-ant-votre_cle_ici
```

⚠️ **IMPORTANT** : Sans cette clé, l'extraction IA ne fonctionnera pas !

## 🎮 Lancement de l'application

### Option 1 : Mode développement (RECOMMANDÉ pour tester)

**Terminal 1 - Backend :**
```bash
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd client
npm run dev
```

Ouvrir : http://localhost:5173

### Option 2 : Mode production

```bash
# 1. Builder le frontend
cd client
npm run build
cd ..

# 2. Démarrer le serveur
npm start
```

Ouvrir : http://localhost:3000

## 🧪 Test rapide

1. Préparer un fichier Word de test (fiche de saisine PRD)
2. Lancer l'application
3. Onglet **Upload**
4. Glisser-déposer le fichier
5. Cliquer "Analyser avec l'IA"
6. ⏳ Attendre l'extraction (5-10 secondes)
7. Vérifier les données extraites
8. Corriger si besoin
9. Valider
10. Vérifier dans **Historique**

## 📊 Structure des données extraites

L'IA extrait automatiquement :

- **Élève** : Nom, Prénom, Date naissance, Classe
- **Établissement** : Nom, Adresse, Email, Téléphone
- **Saisine** : Type (IEN/Chef/DSDEN/Autre), Nom, Date
- **Demandes** : TSA, AESH, TDL, Troubles comportement, etc.

## ❓ Problèmes fréquents

### "ANTHROPIC_API_KEY non définie"
➡️ Remplir la clé dans `.env`

### Le frontend ne s'affiche pas
➡️ Vérifier :
- Backend lancé sur port 3000
- Frontend lancé sur port 5173 (mode dev)
- OU frontend buildé (mode prod)

### Erreur d'extraction
➡️ Vérifier :
- Clé API valide
- Crédits Anthropic disponibles
- Connexion internet

## 📁 Dossiers importants

- `uploads/` - Fichiers uploadés
- `data/` - Base de données SQLite
- `logs/` - Logs de l'application

## 🔒 Sécurité

- Ne JAMAIS committer le fichier `.env`
- Ne JAMAIS partager votre clé API
- La clé API coûte environ 0.001€ par document

## 📞 Aide

Consulter :
- `README.md` - Documentation complète
- `logs/combined.log` - Logs de l'application

---

**Prêt à démarrer ! 🎉**

1. ✅ Configurer `.env` avec votre clé API
2. ✅ Lancer avec `npm run dev`
3. ✅ Tester avec un fichier
