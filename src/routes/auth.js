const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Tokens actifs en mémoire (simple Set)
const activeTokens = new Set();

// 2 utilisateurs autorisés (mots de passe hashés SHA-256)
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const USERS = [
  { email: 'julien@messagingme.fr', passwordHash: sha256('Jrevxc90!') },
  { email: 'cecilepatraud@gmail.com', passwordHash: sha256('Capash@2008') }
];

/**
 * POST /api/login
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
  }

  const user = USERS.find(u => u.email === email.toLowerCase().trim());
  if (!user || user.passwordHash !== sha256(password)) {
    return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });
  }

  // Générer un token simple
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.add(token);

  res.json({ success: true, token, email: user.email });
});

/**
 * POST /api/logout
 */
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    activeTokens.delete(token);
  }
  res.json({ success: true });
});

/**
 * Middleware d'authentification
 */
function requireAuth(req, res, next) {
  // Token via header OU via query param (pour iframe/téléchargement PDF)
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Non authentifié' });
  }
  next();
}

module.exports = { router, requireAuth };
