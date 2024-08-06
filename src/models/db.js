const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./src/fnaticdle.db', (err) => {
    if (err) {
        console.error(`<${new Date().toUTCString()}> Could not connect to database => [${err}]`);
        return;
    } else {
        console.log(`<${new Date().toUTCString()}> Connected to database`);
    }
});

module.exports = db;