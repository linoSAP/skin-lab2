// 🌍 Charge les variables d’environnement
require('dotenv').config();


// 🧱 Modules nécessaires
const flash = require('connect-flash');
const methodOverride = require('method-override');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// 
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');

// 
const db = require('./database/firebase');

const app = express();



// 🔧 Configuration du moteur de vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 📦 Middlewares globaux
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
(async () => {
    await redisClient.connect();
})();



app.use(session({
    store: new RedisStore({ client: redisClient , prefix: "sess:" }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.RENDER === 'true',
        maxAge: 86400000,
        httpOnly: true
    }
}));


app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});

// 🔁 Middleware pour rendre les données accessibles à EJS
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPage = req.path.split('/')[1] || 'home';
    next();
});

// 🛣️ Routes
const indexRouter = require('./routes/index');
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const authRoutes = require('./routes/admin/auth');
const adminRoutes = require('./routes/admin/products');
// const categoriesRoutes  = require('./routes/categories');
const searchRoutes = require('./routes/search');

// 🌐 Configuration des routes principales
app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
// app.use('/categories', categoriesRoutes);
app.use('/search', searchRoutes);

// 🔐 Routes d'administration
app.use('/admin/auth', authRoutes);
app.use('/admin', adminRoutes);

// ⚠️ 404 - Page non trouvée
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page non trouvée',
        currentPage: 'error'
    });
});

// ❌ 500 - Erreur serveur
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