const express = require('express');
const app = express();
const path = require('path');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const ip = require('request-ip');
const fs = require('fs');
const router = require('./routes/index');
const db = require('./models/db');
const admin_auth = require('./middlewares/auth');
require('dotenv').config('./.env');

function hour() { return `<${new Date().toUTCString()}>`; }

app.use(express.json());
app.use(cookieParser());
app.use(ip.mw());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/', router);

let player_to_find;
let found;
let players_tries = {};

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`${hour()} Server is running on ${port}`);
    select_player();
});

cron.schedule('59 59 23 * * *', () => {
    write_logs();
    setTimeout(() => { select_player(); }, 1000);
}, {
    timezone: "Etc/UTC"
});

function select_player() {
    db.all(`SELECT * FROM players`, (err, rows) => {
        if (err) {
            console.error(`${hour()} Error to select new player => [${err}]`);
        } else {
            const randonIndex = Math.floor(Math.random() * rows.length);
            player_to_find = rows[randonIndex];
            found = 1;
            console.log(`${hour()} New player to find => [${player_to_find.player}]`);
        }
    });
}

app.post('/get_data', (req, res) => {
    db.all(`SELECT * FROM players`, (err, rows) => {
        if (err) {
            console.error(`${hour()} Error to get data => [${err}]`);
            res.status(400).json(null);
        } else {
            if (rows) {
                const players = rows.map(p => p.player);
                const attr = rows[0];
                res.json({ players, attr, found });
            } else {
                res.status(400).json(null);
            }
        }
    });
});

app.post('/try_guess', (req, res) => {
    const guess = String(req.body.guess);
    const ip = req.clientIp;
    if (guess) {
        db.get(`SELECT * FROM players WHERE player = (?)`, guess, (err, row) => {
            if (err) {
                console.error(`${hour()} Error to receive guess => [${err}]`);
                res.status(400).json(null);
            } else {
                if (row) {
                    const response = [];
                    if (!players_tries[ip]) { players_tries[ip] = []; }
                    players_tries[ip].push(guess);
                    if (row.player === player_to_find.player) {
                        const nb_tries = parseInt(req.body.nb_tries);
                        if (nb_tries) {
                            found++;
                            console.log(`${hour()} [${req.clientIp}] guess successfully in ${nb_tries} tries`);
                        }
                    }
                    for (let attr in row) {
                        if (typeof row[attr] === 'string') {
                            response.push({ data: row[attr], is_valid: row[attr] === player_to_find[attr] });
                        } else if (typeof row[attr] === 'number') {
                            if (row[attr] !== player_to_find[attr]) {
                                response.push({ data: row[attr], is_valid: false, less: row[attr] > player_to_find[attr] });
                            } else {
                                response.push({ data: row[attr], is_valid: true });
                            }
                        } else {
                            response.push(null);
                        }
                    }
                    res.json(response);
                } else {
                    res.status(400).json(null);
                }
            }
        });
    } else {
        res.status(400).json(null);
    }
});

app.post('/login_admin', (req, res) => {
    const username = String(req.body.u);
    const password = String(req.body.p);
    if (username && password && username.length > 0 && username.length < 65 && password.length > 0 && password.length < 65 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        console.log(`${hour()} [${req.clientIp}] connect to admin panel`);
        const token = generate_token();
        if (token) {
            db.run(`INSERT INTO admin_token (id) VALUES (?)`, token, (err) => {
                if (err) {
                    console.error(`${hour()} Error to login as admin => [${err}]`);
                    res.status(400).json(null);
                } else {
                    res.json(token);
                }
            });
        } else {
            res.status(400).json(null);
        }
    } else {
        console.log(`${hour()} [${req.clientIp}] didn't connect to admin panel`);
        res.status(400).json(null);
    }
});

app.post('/get_data_admin', admin_auth, (req, res) => {
    db.all(`SELECT * FROM players`, (err, rows) => {
        if (err) {
            console.error(`${hour()} Error to receive admin data => [${err}]`);
            res.status(400).json(null);
        } else {
            if (rows) {
                res.json(rows);
            } else {
                res.status(400).json(null);
            }
        }
    });
});

app.post('/add_player', admin_auth, (req, res) => {
    const new_player = req.body.new_player;
    if (new_player) {
        db.run(`INSERT INTO players VALUES (?,?,?,?,?,?,?)`, new_player, (err) => {
            if (err) {
                console.error(`${hour()} Error to add new player => [${err}]`);
                res.status(400).json({ status: false, message: 'Error to insert new player', });
            } else {
                console.log(`${hour()} [${req.clientIp}] add new player => [${new_player[new_player.length - 1]}]`);
                res.json({ status: true });
            }
        });
    } else {
        res.status(400).json({ status: false, message: 'You need to fill all the input to insert new player' });
    }
});

app.post('/edit_player', admin_auth, (req, res) => {
    const edit_attr = req.body.edit_attr;
    if (edit_attr) {
        db.run(`UPDATE players SET (game,nationnality,role,age,arrived,current,player) = (?,?,?,?,?,?,?) WHERE player = (?)`, edit_attr, (err) => {
            if (err) {
                console.error(`${hour()} Error to edit player => [${err}]`);
                res.status(400).json({ status: false, message: 'Error to edit a player' });
            } else {
                console.log(`${hour()} [${req.clientIp}] edit player => [${edit_attr[edit_attr.length - 1]}]`);
                res.json({ status: true });
            }
        });
    } else {
        res.status(400).json({ status: false, message: 'You need to fill all the input and select a player' });
    }
});

function write_logs() {
    const logs_dir = path.join(__dirname, 'logs');
    const date = new Date();
    const logs_file = path.join(logs_dir, `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}.txt`);
    let content = '';
    content += `Date : ${date.getDate()} / ${date.getMonth() + 1} / ${date.getFullYear()}\n`;
    content += `Player to find : ${player_to_find.player}\n`;
    content += `Number of players who tries : ${Object.keys(players_tries).length}\n`;
    content += `Number of players who found : ${found}\n`;
    if (players_tries) {
        content += `{\n`;
        for (let ip in players_tries) {
            content += `    ${ip} : [${players_tries[ip]}]\n`
        }
        content += `}`;
    } else {
        content += `{}`;
    }
    fs.writeFile(logs_file, content, err => {
        if (err) { 
            console.error(`${hour()} Error to write title in logs => [${err}]`);
        }
    });
    console.log(`${hour()} Success to write logs of the day`);
    players_tries = {};
}

function generate_token() {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopkrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 50; i++) {
        token += c[Math.floor(Math.random() * c.length)];
    }
    return token;
}