const express = require('express');
const router = express.Router();

// Route pour le dashboard admin
router.get('/dashboard', (req, res) => {
    res.render('admin/dashboard', {
        title: 'Tableau de bord Admin',
        layout: 'admin-layout'
    });
});

module.exports = router;