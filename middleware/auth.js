module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        // Stocker la page demandée pour redirection après login
        req.session.returnTo = req.originalUrl;
        res.redirect('/admin/auth/login');
    },

    forwardAuthenticated: (req, res, next) => {
        if (!req.session.user) {
            return next();
        }
        res.redirect('/admin/dashboard');
    }
};