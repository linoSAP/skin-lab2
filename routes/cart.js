const express = require('express');
const router = express.Router();

const COOKIE_NAME = 'app_data'; // Assure-toi que c'est le même que dans app.js

// Middleware pour initialiser le panier dans appData
router.use((req, res, next) => {
    console.log('[Middleware] appData avant init:', req.appData);

    if (!req.appData) {
        req.appData = { user: null, cart: { items: [] }, returnTo: null };
        console.log('[Middleware] appData créé car absent');
    }
    if (!req.appData.cart) {
        req.appData.cart = { items: [] };
        console.log('[Middleware] cart créé car absent');
    }
    if (!Array.isArray(req.appData.cart.items)) {
        req.appData.cart.items = [];
        console.log('[Middleware] cart.items recréé car pas un tableau');
    }

    console.log('[Middleware] appData après init:', req.appData);
    next();
});

// Fonction pour mettre à jour le cookie avec les données actuelles
function updateCookie(req, res) {
    console.log('[updateCookie] Mise à jour cookie avec appData:', req.appData);
    res.cookie(COOKIE_NAME, JSON.stringify(req.appData), {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 jour
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
}

router.post('/plus', (req, res) => {
    console.log('\n[POST /cart/plus] 📥 Requête reçue avec:', req.body);

    const { productId } = req.body;

    if (!productId) {
        console.log('[POST /cart/plus] ❌ ID produit manquant');
        return res.status(400).json({ success: false, error: 'ID produit manquant' });
    }

    const cartItem = req.appData.cart.items.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity = (cartItem.quantity || 1) + 1;
        console.log(`[POST /cart/plus] ✅ Quantité augmentée pour produit ${productId} => ${cartItem.quantity}`);

        updateCookie(req, res);
        console.log('[POST /cart/plus] 🍪 Cookie mis à jour');

        return res.json({ 
            success: true, 
            count: getCartCount(req),
            totalItems: getTotalItemsCount(req)
        });
    } else {
        console.log(`[POST /cart/plus] ❌ Produit ${productId} non trouvé dans le panier`);
        return res.status(404).json({ success: false, error: 'Produit non trouvé dans le panier' });
    }
});


router.post('/minus', (req, res) => {
    console.log('\n[POST /cart/minus] 📥 Requête reçue avec:', req.body);

    const { productId } = req.body;

    if (!productId) {
        console.log('[POST /cart/minus] ❌ ID produit manquant');
        return res.status(400).json({ success: false, error: 'ID produit manquant' });
    }

    const cartItemIndex = req.appData.cart.items.findIndex(item => item.id === productId);

    if (cartItemIndex === -1) {
        console.log(`[POST /cart/minus] ❌ Produit ${productId} non trouvé dans le panier`);
        return res.status(404).json({ success: false, error: 'Produit non trouvé dans le panier' });
    }

    const item = req.appData.cart.items[cartItemIndex];

    if (item.quantity > 1) {
        item.quantity -= 1;
        console.log(`[POST /cart/minus] ✅ Quantité réduite pour produit ${productId} => ${item.quantity}`);
    } else {
        req.appData.cart.items.splice(cartItemIndex, 1);
        console.log(`[POST /cart/minus] 🗑 Produit supprimé du panier: ${productId}`);
    }

    updateCookie(req, res);
    console.log('[POST /cart/minus] 🍪 Cookie mis à jour');

    return res.json({
        success: true,
        count: getCartCount(req),
        totalItems: getTotalItemsCount(req)
    });
});



// Route pour afficher le panier
// Route pour afficher le panier
router.get('/', (req, res) => {
    console.log('[GET /cart] appData:', req.appData);
    const cartItems = req.appData.cart.items || [];

    // Étape 1 : Ne garder que les produits valides (affichables)
    const validItems = cartItems.filter(item => {
        return item.id && item.name && !isNaN(Number(item.price));
    });

    // Étape 2 : Calculer le total uniquement sur les produits valides
    const total = validItems.reduce((sum, item) => {
        const price = Number(item.price);
        return sum + price * (item.quantity || 1);
    }, 0);

    console.log(`[GET /cart] ✅ total: ${total} XAF, produits valides: ${validItems.length}`);

    // Étape 3 : Rendu avec uniquement les produits valides
    res.render('cart', {
        title: 'Votre Panier - Skin Girl Lab',
        cartItems: validItems,
        total: total
    });
});


// Route pour ajouter un produit
router.post('/add', (req, res) => {
    console.log('[POST /cart/add] Reçu:', req.body);
    const { productId, name, price, image } = req.body;

    if (!productId || !name || isNaN(price) || !image) {
        console.log('[POST /cart/add] Données produit invalides');
        return res.status(400).json({ error: 'Données produit invalides' });
    }

    const cartItem = req.appData.cart.items.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = (cartItem.quantity || 0) + 1;
        console.log(`[POST /cart/add] Quantité augmentée pour produit ${productId}: ${cartItem.quantity}`);
    } else {
        req.appData.cart.items.push({
            id: productId,
            name: name,
            price: Number(price),
            image: image,
            quantity: 1
        });
        console.log(`[POST /cart/add] Produit ajouté: ${productId}`);
    }

    updateCookie(req, res);

    res.json({ 
        success: true, 
        count: getCartCount(req),
        totalItems: getTotalItemsCount(req)
    });
});

router.post('/remove', (req, res) => {
    console.log('\n[POST /cart/remove] 📥 Requête reçue avec:', req.body);

    const { productId } = req.body;

    if (!productId) {
        console.log('[POST /cart/remove] ❌ ID produit manquant');
        return res.status(400).json({ success: false, error: 'ID produit manquant' });
    }

    const index = req.appData.cart.items.findIndex(item => item.id === productId);

    if (index === -1) {
        console.log(`[POST /cart/remove] ❌ Produit ${productId} introuvable dans le panier`);
        return res.status(404).json({ success: false, error: 'Produit non trouvé dans le panier' });
    }

    const removedItem = req.appData.cart.items[index];
    req.appData.cart.items.splice(index, 1);

    console.log(`[POST /cart/remove] 🗑 Produit supprimé: ${removedItem.name} (${removedItem.id})`);

    updateCookie(req, res);
    console.log('[POST /cart/remove] 🍪 Cookie mis à jour');

    return res.json({
        success: true,
        count: getCartCount(req),
        totalItems: getTotalItemsCount(req)
    });
});



// Route pour compter les articles
router.get('/count', (req, res) => {
    console.log('[GET /cart/count] appData.cart.items:', req.appData.cart.items);
    res.json({ 
        distinctProducts: getCartCount(req),
        totalItems: getTotalItemsCount(req)
    });
});

// Fonctions utilitaires protégées
function getCartCount(req) {
    if (req.appData && req.appData.cart && Array.isArray(req.appData.cart.items)) {
        return req.appData.cart.items.length;
    }
    return 0;
}

function getTotalItemsCount(req) {
    if (req.appData && req.appData.cart && Array.isArray(req.appData.cart.items)) {
        return req.appData.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
    }
    return 0;
}

function getCartForSend(req) {
    const items = req.appData.cart.items || [];
    return {
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            itemTotal: (item.price * item.quantity).toFixed(2)
        })),
        subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalItems: items.reduce((total, item) => total + item.quantity, 0),
        distinctProducts: items.length
    };
}

router.get('/forsend', (req, res) => {
    console.log('[GET /cart/forsend] Envoi des données:', getCartForSend(req));
    res.json(getCartForSend(req));
});

module.exports = router;