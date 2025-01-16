const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

db.connect((err) => {
    if (err) {
        console.error(`<${new Date().toUTCString()}> Could not connect to database => [${err}]`);
        return;
    } else {
        console.log(`<${new Date().toUTCString()}> Connected to database`);
    }
});

module.exports = db;