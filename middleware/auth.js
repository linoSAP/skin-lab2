module.exports = {
    ensureAuthenticated: (req, res, next) => {
      if (req.appData && req.appData.user) {
        return next();
      }
      // Stocker la page demandée pour redirection après login
      if (req.appData) {
        req.appData.returnTo = req.originalUrl;
      }
      // Sauvegarder dans le cookie
      res.saveAppData && res.saveAppData();
      res.redirect('/admin/auth/login');
    },
  
    forwardAuthenticated: (req, res, next) => {
      if (!req.appData || !req.appData.user) {
        return next();
      }
      res.redirect('/admin/dashboard');
    }
  };
  