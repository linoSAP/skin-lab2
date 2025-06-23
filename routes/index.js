const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', (req, res) => {
    Product.getAll((err, products) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur serveur');
        }
        
        // Sélectionner 3 produits aléatoires pour la page d'accueil
        const featuredProducts = products.sort(() => 0.5 - Math.random()).slice(0, 3);
        res.render('index', { 
            title: 'Accueil - Skin Girl Lab',
            featuredProducts 
        });
    });
});

module.exports = router;