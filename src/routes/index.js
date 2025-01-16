const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

router.get('*', (req, res) => {
    res.send(`This page doesn't exist <br><br> Go back to main <a href='/'>menu<a>`);
});

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error 500 watch console');
});

module.exports = router;