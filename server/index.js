// Real-time chat server.
//
// Three pieces work together here:
//   - Express  : the classic HTTP server. It serves the React build and a small
//                REST endpoint.
//   - Socket.io: the live connection. Once it is open, the server can push a
//                message to every browser without the browser having to ask.
//   - SQLite   : the storage. Every message is written to disk, so the history
//                survives a refresh and even a server restart.
//
// SQLite ships inside Node itself since v22, so there is no database to install
// and no native module to compile: `node:sqlite` is part of the runtime.

const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ROOM = 'general';

// Who is currently connected: socket id -> display name.
const onlineUsers = new Map();
// Who is currently typing: a set of display names.
const typingUsers = new Set();

// 1. Database ----------------------------------------------------------------

const db = new DatabaseSync(join(__dirname, 'chat.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    author     TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Prepared statements are compiled once and reused: faster, and the values are
// always passed separately from the SQL, which is what prevents SQL injection.
const insertMessage = db.prepare(
  'INSERT INTO messages (author, body) VALUES (?, ?)'
);
const selectMessageById = db.prepare('SELECT * FROM messages WHERE id = ?');
const selectMessagesAfter = db.prepare(
  'SELECT * FROM messages WHERE id > ? ORDER BY id'
);
const selectAllMessages = db.prepare('SELECT * FROM messages ORDER BY id');

function saveMessage(author, body) {
  const { lastInsertRowid } = insertMessage.run(author, body);
  return selectMessageById.get(lastInsertRowid);
}

// 2. HTTP server -------------------------------------------------------------

const app = express();
const server = createServer(app);

// Serve the compiled React app. In development the React dev server runs on its
// own port and forwards its calls here, so this only matters after a build.
app.use(express.static(join(__dirname, '..', 'client', 'dist')));

// A plain REST endpoint: Express is a normal HTTP API server on top of all this.
app.get('/api/messages', (_req, res) => {
  res.json(selectAllMessages.all());
});

// 3. Real-time layer ---------------------------------------------------------

const io = new Server(server, {
  // Lets a socket that dropped for a few seconds pick up where it left off
  // instead of starting a brand new session.
  connectionStateRecovery: {},
});

io.on('connection', (socket) => {
  // --- Replay on connect ----------------------------------------------------
  // The browser tells us the id of the last message it already holds. We send
  // back everything that came after it, so a reconnection loses no message and
  // duplicates none either.
  const lastSeenId = Number(socket.handshake.auth.lastMessageId) || 0;
  socket.emit('history', selectMessagesAfter.all(lastSeenId));

  // --- Joining --------------------------------------------------------------
  socket.on('join', (name) => {
    const displayName = String(name || '').trim().slice(0, 24);
    if (!displayName) return;

    // Arrivals and departures are sent as a `notice`, not as a `message`: they
    // are shown live but never stored, so the history stays a history of what
    // people actually said.
    //
    // Announce the arrival only if this person was not already here through
    // another tab, so opening a second tab does not post a duplicate line.
    const alreadyHere = [...onlineUsers.values()].includes(displayName);

    socket.data.name = displayName;
    socket.join(ROOM);
    onlineUsers.set(socket.id, displayName);

    if (!alreadyHere) {
      io.to(ROOM).emit('notice', `${displayName} a rejoint le salon`);
    }
    broadcastPresence();
  });

  // --- Sending a message ----------------------------------------------------
  socket.on('message', (body) => {
    const name = socket.data.name;
    const text = String(body || '').trim().slice(0, 1000);
    if (!name || !text) return;

    // Store first, broadcast second: if the write fails, nobody is shown a
    // message that does not actually exist.
    const saved = saveMessage(name, text);

    // Sending ends the typing state.
    typingUsers.delete(name);
    broadcastTyping();

    io.to(ROOM).emit('message', saved);
  });

  // --- Typing indicator -----------------------------------------------------
  socket.on('typing', (isTyping) => {
    const name = socket.data.name;
    if (!name) return;

    if (isTyping) typingUsers.add(name);
    else typingUsers.delete(name);

    broadcastTyping();
  });

  // --- Leaving --------------------------------------------------------------
  socket.on('disconnect', () => {
    const name = socket.data.name;
    if (!name) return;

    onlineUsers.delete(socket.id);
    typingUsers.delete(name);

    // The same person may have two tabs open: only announce the departure once
    // their last connection is gone.
    if (![...onlineUsers.values()].includes(name)) {
      io.to(ROOM).emit('notice', `${name} a quitté le salon`);
    }

    broadcastPresence();
    broadcastTyping();
  });
});

// Helpers --------------------------------------------------------------------

function broadcastPresence() {
  // The Set removes duplicates when one person has several tabs open.
  io.emit('presence', [...new Set(onlineUsers.values())]);
}

function broadcastTyping() {
  io.emit('typing', [...typingUsers]);
}

// 4. Start -------------------------------------------------------------------

server.listen(PORT, () => {
  console.log(`Chat server listening on http://localhost:${PORT}`);
});
