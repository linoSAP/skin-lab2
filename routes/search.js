const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', (req, res) => {
    const query = req.query.q;
    if (!query) return res.redirect('/products');

    Product.search(query, (err, results) => {
        res.render('search', {
            title: `Résultats pour "${query}"`,
            query,
            results
        });
    });
});

module.exports = router;

