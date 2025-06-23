const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const { ensureAuthenticated } = require('../../middleware/auth');

// Afficher toutes les catégories
router.get('/', ensureAuthenticated, (req, res) => {
    Category.getAll((err, categories) => {
        if (err) throw err;
        res.render('admin/categories', { 
            title: 'Gestion des catégories',
            categories,
            currentUser: req.session.user
        });
    });
});

// Ajouter une catégorie
router.post('/', ensureAuthenticated, (req, res) => {
    Category.create(req.body.name, (err) => {
        if (err) {
            req.flash('error', 'Erreur lors de la création');
            return res.redirect('/admin/categories');
        }
        req.flash('success', 'Catégorie créée');
        res.redirect('/admin/categories');
    });
});

module.exports = router;