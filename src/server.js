require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

// Initialiser la base de données
const { getDatabase } = require('./db/database');
const { initDatabase } = require('./db/init');

// Routes
const uploadRoutes = require('./routes/upload');
const fichesRoutes = require('./routes/fiches');
const pdfRoutes = require('./routes/pdf');
const propositionsRoutes = require('./routes/propositions');

const app = express();
const PORT = process.env.PORT || 3000;

// Créer les dossiers nécessaires
const dirs = [
  process.env.UPLOAD_DIR || './uploads',
  process.env.OUTPUT_DIR || './output',
  './logs',
  './data'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Dossier créé: ${dir}`);
  }
});

// Initialiser la base de données au démarrage
(async () => {
  try {
    logger.info('Initialisation de la base de données...');
    await initDatabase();
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de la BDD:', error);
  }
})();

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false // Désactiver pour le développement
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*'
}));

// Compression
app.use(compression());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting pour les uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads max par 15 minutes
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

// Logs des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes API
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/fiches', fichesRoutes);
app.use('/api/fiches', pdfRoutes);
app.use('/api/propositions', propositionsRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Servir les fichiers statiques du frontend (après build)
const frontendPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // Route catch-all pour le frontend (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  logger.warn('Frontend non buildé. Exécutez: cd client && npm run build');
}

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée:', err);

  // Erreur Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Fichier trop volumineux (max 10MB)'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur serveur interne'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  logger.info(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🗄️  Base de données: ${process.env.DATABASE_PATH || './data/prd.db'}`);

  // Vérifier la clé API Anthropic
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn('⚠️  ANTHROPIC_API_KEY non définie - l\'extraction IA ne fonctionnera pas');
  }
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
  logger.info('Arrêt du serveur...');
  const { closeDatabase } = require('./db/database');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Arrêt du serveur...');
  const { closeDatabase } = require('./db/database');
  closeDatabase();
  process.exit(0);
});
