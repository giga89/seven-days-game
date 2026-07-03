const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 80;

app.use(express.json());
app.use(express.static('public'));

// Database setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        db.run('CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, played INTEGER, last_played TEXT)', (err) => {
            if (err) {
                console.log("Table already exists or error: ", err);
            }
        });
    }
});

// Helper: Genera un ID basato sull'IP (semplice tracciamento per MVP)
function getClientId(req) {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}

// API: Check if user has played
app.get('/api/check-run', (req, res) => {
    const clientId = getClientId(req);
    db.get('SELECT played FROM players WHERE id = ?', [clientId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ played: row ? !!row.played : false });
    });
});

// API: Finish run
app.post('/api/finish-run', (req, res) => {
    const clientId = getClientId(req);
    const date = new Date().toISOString();
    
    db.run('INSERT OR REPLACE INTO players (id, played, last_played) VALUES (?, 1, ?)', [clientId, date], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// API: Reset run (per testing o futuro pagamento)
app.post('/api/reset-run', (req, res) => {
    const clientId = getClientId(req);
    
    db.run('UPDATE players SET played = 0 WHERE id = ?', [clientId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
