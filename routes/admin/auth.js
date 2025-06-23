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

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // Vérifie le nom d'utilisateur
    if (username !== adminUsername) {
        return res.status(401).render('admin/login', {
            error: 'Identifiants incorrects',
            title: 'Connexion Admin'
        });
    }

    // Vérifie le mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
        return res.status(401).render('admin/login', {
            error: 'Identifiants incorrects',
            title: 'Connexion Admin'
        });
    }

    // Génère un token JWT
    const token = jwt.sign({ username }, process.env.SESSION_SECRET, {
        expiresIn: '1h'
    });

    // 💡 Ajoute cette ligne pour que req.session.user fonctionne
    req.session.user = { username };

    // Stocke le token dans un cookie
    res.cookie('token', token, { httpOnly: true });

    // Redirection intelligente
    const redirectTo = req.session.returnTo || '/admin/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectTo);
});

module.exports = router;
