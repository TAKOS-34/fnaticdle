const db = require('../models/db');

function admin_auth(req, res, next) {
    const token = String(req.cookies.admin_token);
    if (token) {
        db.get(`SELECT id FROM admin_token WHERE id = (?)`, token, (err, row) => {
            if (row) {
                next();
            } else {
                res.clearCookie('admin_token');
                res.redirect('/admin-login');
            }
        });
    } else {
        res.redirect('/admin-login');
    }
}

module.exports = admin_auth;