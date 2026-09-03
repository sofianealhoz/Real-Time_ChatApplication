// Empties the message history. Handy right before a demo, so the room starts
// clean. Run it with: npm run reset
//
// The table itself is kept, only its rows are removed.

const { join } = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(join(__dirname, 'chat.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    author     TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const { changes } = db.prepare('DELETE FROM messages').run();
console.log(`${changes} message(s) supprimé(s). Le salon repart de zéro.`);
