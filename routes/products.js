const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Route pour afficher tous les produits ou filtrer par catégorie
router.get(['/', '/category/:categoryId'], async (req, res) => {
    try {
        console.log('--- Début de la route GET / ou /category/:categoryId ---');
        
        // 1. Récupérer toutes les catégories pour le filtre
        console.log('Récupération des catégories...');
        const categories = await new Promise((resolve, reject) => {
            Category.getAll((err, cats) => {
                if (err) {
                    console.error('Erreur lors de la récupération des catégories:', err);
                    return reject(err);
                }
                console.log('Catégories récupérées:', cats.length);
                resolve(cats);
            });
        });

        // 2. Déterminer si on filtre par catégorie
        let currentCategory = null;
        let products;

        if (req.params.categoryId) {
            console.log(`Filtrage par catégorie ID: ${req.params.categoryId}`);
            currentCategory = categories.find(c => c.id == req.params.categoryId);
            
            if (!currentCategory) {
                console.log('Catégorie non trouvée');
                return res.status(404).send('Catégorie non trouvée');
            }

            console.log('Catégorie sélectionnée:', currentCategory.name);
            products = await new Promise((resolve, reject) => {
                Product.getByCategory(req.params.categoryId, (err, prods) => {
                    if (err) {
                        console.error('Erreur lors de la récupération des produits par catégorie:', err);
                        return reject(err);
                    }
                    console.log('Produits filtrés récupérés:', prods.length);
                    resolve(prods);
                });
            });
        } else {
            console.log('Pas de filtrage, récupération de tous les produits avec leurs catégories...');
            products = await new Promise((resolve, reject) => {
                Product.getAllWithCategories((err, prods) => {
                    if (err) {
                        console.error('Erreur lors de la récupération de tous les produits:', err);
                        return reject(err);
                    }
                    console.log('Tous les produits récupérés:', prods.length);
                    resolve(prods);
                });
            });
        }

        // 3. Déterminer le type de réponse (AJAX ou normale)
        const isAjaxRequest = req.xhr || req.headers.accept.indexOf('json') > -1;

        if (isAjaxRequest) {
            console.log('Requête AJAX détectée - renvoi du partial');
            return res.render('partials/_products-grid', {
                products: products,
                currentCategory: currentCategory,
                layout: false
            });
        }

        console.log('Requête normale - renvoi de la page complète');
        return res.render('products', {
            products: products,
            categories: categories,
            currentCategory: currentCategory,
            searchQuery: req.query.q || null
        });

    } catch (err) {
        console.error('Erreur attrapée dans le catch:', err);
        if (!res.headersSent) {
            return res.status(500).render('error', {
                error: 'Une erreur est survenue',
                layout: false
            });
        }
    }
});

// Route pour la recherche
router.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    
    Product.search(searchTerm, (err, products) => {
        if (err) {
            console.error('Erreur recherche:', err);
            return res.status(500).send('Erreur serveur');
        }

        Category.getAll((err, categories) => {
            res.render('products', {
                products: products,
                categories: categories,
                currentCategory: null,
                searchQuery: searchTerm
            });
        });
    });
});

module.exports = router;