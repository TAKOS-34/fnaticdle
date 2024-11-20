const express = require('express');
const path = require('path');
const router = express.Router();
const admin_auth = require('../middlewares/auth');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

router.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin-login.html'));
});

router.get('/admin-panel', admin_auth, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin-panel.html'));
});

router.get('*', (req, res) => {
    res.send(`This page doesn't exist <br><br> Go back to main <a href='/'>menu<a>`);
});

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error 500 watch console');
});

module.exports = router;