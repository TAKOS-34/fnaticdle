const express = require('express');
const app = express();
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
require('dotenv').config();
const router = require('./routes/index');
const db = require('./config/db');

function hour() { return `<${new Date().toUTCString()}>`; }

app.use(express.json());
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

app.post('/user/get_data', (req, res) => {
    db.query(`SELECT game,nationnality,role,birthdate AS age,arrived,current,player FROM players`, (err, rows) => {
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

app.post('/user/try_guess', (req, res) => {
    const guess = String(req.body.guess);
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (guess) {
        db.query(`SELECT game,nationnality,role,TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) as age,arrived,current,player FROM players WHERE player = (?)`, guess, (err, row) => {
            if (err) {
                console.error(`${hour()} Error to receive guess => [${err}]`);
                res.status(400).json(null);
            } else {
                if (row && row.length === 1) {
                    const guess = row[0]
                    const response = [];
                    if (!players_tries[ip]) { players_tries[ip] = []; }
                    players_tries[ip].push(guess.player);
                    if (guess.player === player_to_find.player) {
                        const nb_tries = parseInt(req.body.nb_tries);
                        if (nb_tries) {
                            found++;
                            console.log(`${hour()} [${ip}] guess successfully in ${nb_tries} tries`);
                        }
                    }
                    for (let attr in guess) {
                        if (typeof guess[attr] === 'string') {
                            response.push({ data: guess[attr], is_valid: guess[attr] === player_to_find[attr] });
                        } else if (typeof guess[attr] === 'number') {
                            if (guess[attr] !== player_to_find[attr]) {
                                response.push({ data: guess[attr], is_valid: false, less: guess[attr] > player_to_find[attr] });
                            } else {
                                response.push({ data: guess[attr], is_valid: true });
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

function select_player() {
    db.query(`SELECT game,nationnality,role,TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) as age,arrived,current,player FROM players`, (err, rows) => {
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

function write_logs() {
    const logs_dir = path.join(__dirname, 'logs');
    const date = new Date();
    const logs_file = path.join(logs_dir, `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}.txt`);
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