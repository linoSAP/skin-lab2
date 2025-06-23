const express = require('express');
const router = express.Router();

// Middleware pour initialiser le panier dans la session
router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = { items: [] };
    }
    next();
});

// Route pour afficher le panier
router.get('/', (req, res) => {
    // Assurez-vous que cart.items existe et est un tableau
    const cartItems = req.session.cart?.items || [];
    
    // Calcul du total en vérifiant que chaque item a un prix valide
    const total = cartItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        return sum + (price * (item.quantity || 1));
    }, 0);

    // Filtrer les items invalides (sans prix)
    const validItems = cartItems.filter(item => {
        return item.id && item.name && !isNaN(Number(item.price));
    });

    res.render('cart', {
        title: 'Votre Panier - Skin Girl Lab',
        cartItems: validItems, // N'envoyer que les items valides
        total: total
    });
});

// Route pour ajouter un produit
router.post('/add', (req, res) => {
    const { productId, name, price, image } = req.body;

    if (!productId || !name || isNaN(price) || !image) {
        return res.status(400).json({ error: 'Données produit invalides' });
    }
    const cartItem = req.session.cart.items.find(item => item.id == productId);

    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        req.session.cart.items.push({
            id: productId,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    res.json({ 
        success: true, 
        count: req.session.cart.items.length 
    });
});

// Route pour mettre à jour la quantité
router.post('/update', (req, res) => {
    const { productId, action } = req.body;
    const cartItem = req.session.cart.items.find(item => item.id == productId);

    if (cartItem) {
        if (action === 'increase') {
            cartItem.quantity += 1;
        } else if (action === 'decrease' && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
        }
    }

    res.json({ success: true, count: getCartCount(req) });
});

// Route pour supprimer un produit
router.post('/remove', (req, res) => {
    const { productId } = req.body;
    req.session.cart.items = req.session.cart.items.filter(item => item.id != productId);
    
    res.json({ success: true, count: getCartCount(req) });
});

// Route pour compter les articles
router.get('/count', (req, res) => {
    res.json({ 
        distinctProducts: getCartCount(req), // Nombre de produits différents
        totalItems: getTotalItemsCount(req) // Total des articles (quantités cumulées)
    });
});

// Fonction utilitaire pour compter les articles
function getCartCount(req) {
    return req.session.cart.items.length;
}
function getTotalItemsCount(req) {
    // Compter le total des articles (quantités additionnées)
    return req.session.cart.items.reduce((total, item) => total + item.quantity, 0);
}


function getCartForSend(req) {
    return {
        items: req.session.cart.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            itemTotal: (item.price * item.quantity).toFixed(2)
        })),
        subtotal: req.session.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalItems: req.session.cart.items.reduce((total, item) => total + item.quantity, 0),
        distinctProducts: req.session.cart.items.length
    };
}

// Ajoutez cette nouvelle route avant module.exports
router.get('/forsend', (req, res) => {
    res.json(getCartForSend(req));
});
module.exports = router;