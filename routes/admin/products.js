const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../../models/Product');
const { storage } = require('../../database/cloudinary');
const Category = require('../../models/Category')
const { ensureAuthenticated } = require('../../middleware/auth');

const upload = multer({ storage });

console.log('[ADMIN ROUTES] Initialisation des routes admin');

// Route GET /admin/dashboard
router.get('/dashboard', ensureAuthenticated, (req, res, next) => {
    console.log('[GET /dashboard] Accès au dashboard admin');
    console.log('[GET /dashboard] Session user:', req.session.user);

    Product.getAll((err, products) => {
        if (err) {
            console.error('[GET /dashboard] Erreur Product.getAll:', err);
            return next(err);
        }

        console.log('[GET /dashboard] Produits récupérés:', products.length);
        res.render('admin/dashboard', {
            title: 'Tableau de bord',
            products,
            currentUser: req.session.user
        });
    });
});

// Route GET /admin/products/new
router.get('/products/new', ensureAuthenticated, (req, res) => {
    Category.getAll((err, categories) => {
        if (err) throw err;
        
        res.render('admin/new-product', {
            title: 'Nouveau produit',
            product: {
                name: '',
                description: '',
                price: '',
                image: '',
                category: ''
            },
            categories: categories || [],
            currentUser: req.session.user,
            error: null
        });
    });
});




// Modifiez la route POST pour gérer les fichiers
router.post('/products', ensureAuthenticated, upload.single('image'), (req, res, next) => {
    const imageUrl = req.file ? req.file.path : ''; // <- Ajout sécurité
    const productData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        image: imageUrl,
        category: req.body.category_id
    };

    Product.create(productData, (err) => {
        if (err) {
            Category.getAll((err, categories) => {
                return res.render('admin/new-product', {
                    title: 'Nouveau produit',
                    product: productData,
                    categories: categories || [],
                    error: 'Erreur lors de la création: ' + err.message,
                    currentUser: req.session.user
                });
            });
        } else {
            req.flash('success', 'Produit créé avec succès');
            res.redirect('/admin/dashboard');
        }
    });
});


// Route GET /admin/products/:id/edit - Afficher le formulaire d'édition
router.get('/:id/edit', ensureAuthenticated, (req, res, next) => {
    console.log(`[GET /products/${req.params.id}/edit] Accès au formulaire d'édition`);

    Product.getById(req.params.id, (err, product) => {
        if (err || !product) {
            console.error(`Erreur recherche produit ${req.params.id}:`, err);
            req.flash('error', 'Produit non trouvé');
            return res.redirect('/admin/dashboard');
        }

        res.render('admin/edit-product', {
            title: 'Éditer produit',
            product,
            currentUser: req.session.user,
            error: null
        });
    });
});

router.post('/:id/products', ensureAuthenticated, upload.single('image'), (req, res, next) => {
    const imageUrl = req.file ? req.file.path : req.body.existingImage || '';

    const updateData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        image: imageUrl,
        category: req.body.category_id
    };

    Product.update(req.params.id, updateData, (err) => {
        if (err) {
            Product.getById(req.params.id, (e, product) => {
                res.render('admin/edit-product', {
                    title: 'Éditer produit',
                    product: { ...product, ...updateData },
                    error: req.flash('error', 'Erreur lors de la mise à jour'),
                    currentUser: req.session.user
                });
            });
        } else {
            req.flash('success', 'Produit mis à jour avec succès');
            res.redirect('/admin/dashboard');
        }
    });
});


router.post('/:id/delete', ensureAuthenticated, (req, res, next) => {
    console.log(`[DELETE /products/${req.params.id}] Suppression produit`);

    Product.delete(req.params.id, (err) => {
        if (err) {
            console.error(`Erreur suppression produit ${req.params.id}:`, err);
            req.flash('error', 'Erreur lors de la suppression');
            return res.redirect('/admin/dashboard');
        }
        req.flash('success', 'Produit supprimé avec succès');
        res.redirect('/admin/dashboard');
    });
});
module.exports = router;