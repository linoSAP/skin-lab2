// 🌍 Charge les variables d’environnement
require('dotenv').config();

// 🧱 Modules nécessaires
const methodOverride = require('method-override');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./database/firebase');

const app = express();
const COOKIE_NAME = 'app_data';

// 📦 Middlewares globaux (ordre important !)
// 1️⃣ Le cookieParser doit être placé en premier avant tout middleware qui accède aux cookies
app.use(cookieParser());

// 2️⃣ Body parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// 3️⃣ Static files, method override
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// 🛠 Middleware custom pour gérer appData dans req, lire et sauver dans cookie
app.use((req, res, next) => {
  let appData = { user: null, cart: { items: [] }, returnTo: null, flashMessages: [] };

  if (req.cookies[COOKIE_NAME]) {
    try {
      appData = JSON.parse(req.cookies[COOKIE_NAME]);
      if (!Array.isArray(appData.flashMessages)) appData.flashMessages = [];
    } catch (e) {
      console.warn('❌ Cookie app_data corrompu ou invalide');
      appData = { user: null, cart: { items: [] }, returnTo: null, flashMessages: [] };
    }
  }

  req.appData = appData;

  // Fonction pour sauvegarder appData dans cookie
  res.saveAppData = () => {
    const cookieOptions = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 jour
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
    res.cookie(COOKIE_NAME, JSON.stringify(req.appData), cookieOptions);
  };

  next();
});

// Middleware pour exposer flashMessages à EJS et vider après lecture
app.use((req, res, next) => {
  res.locals.flashMessages = req.appData.flashMessages || [];
  req.appData.flashMessages = [];
  res.saveAppData();
  next();
});

// 🔧 Configuration du moteur de vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🔁 Middleware pour rendre les données accessibles à EJS
app.use((req, res, next) => {
  res.locals.currentUser = req.appData.user || null;
  res.locals.currentPage = req.path.split('/')[1] || 'home';
  next();
});

// 🛣️ Routes
const indexRouter = require('./routes/index');
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const authRoutes = require('./routes/admin/auth');
const adminRoutes = require('./routes/admin/products');
const searchRoutes = require('./routes/search');

app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/search', searchRoutes);
app.use('/admin/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/clear', (req, res) => {
  req.appData.cart.items = [];
  res.cookie('app_data', '', { maxAge: 0, path: '/' }); // supprime le cookie
  res.json({ success: true, message: 'Panier vidé' });
});
// ⚠️ 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page non trouvée',
    currentPage: 'error'
  });
});

// ❌ 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', {
    title: 'Erreur serveur',
    currentPage: 'error'
  });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
