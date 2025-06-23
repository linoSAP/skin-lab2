const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

router.get('/login', (req, res) => {
    res.render('admin/login', { 
        title: 'Connexion Admin',
        error: null, // Initialise error
        messages: {} // Initialise messages
    });
});

router.post('/clear', (req, res) => {
  req.appData.cart.items = [];
  res.cookie('app_data', '', { maxAge: 0, path: '/' }); // supprime le cookie
  res.json({ success: true, message: 'Panier vidé' });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    console.log('POST /login reçu avec username:', username);
  
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
    // Vérifie le nom d'utilisateur
    if (username !== adminUsername) {
      console.log('Nom utilisateur incorrect');
      return res.status(401).render('admin/login', {
        error: 'Identifiants incorrects',
        title: 'Connexion Admin'
      });
    }
  
    // Vérifie le mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(401).render('admin/login', {
        error: 'Identifiants incorrects',
        title: 'Connexion Admin'
      });
    }
  
    console.log('Authentification réussie');
  
    // Génère un token JWT
    const token = jwt.sign({ username }, process.env.SESSION_SECRET, {
      expiresIn: '1h'
    });
    console.log('Token JWT généré:', token);
  
    // Met à jour req.appData.user (gestion cookie)
    req.appData.user = { username };
    console.log('req.appData après ajout user:', req.appData);
  
    // Remarque importante :
    // Le cookie 'app_data' est mis à jour automatiquement dans ton middleware via res.on('finish').
    // Si tu souhaites forcer la mise à jour maintenant, tu peux faire :
    res.cookie('app_data', JSON.stringify(req.appData), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  
    // Stocke le token dans un cookie séparé
    res.cookie('token', token, { httpOnly: true });
  
    // Redirection intelligente
    const redirectTo = req.appData.returnTo || '/admin/dashboard';
    console.log('Redirection vers:', redirectTo);
    delete req.appData.returnTo;
  
    res.redirect(redirectTo);
  });
  

module.exports = router;
