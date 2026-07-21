// Importing required modules
const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

// Cost factor for password hashing. Higher = slower to brute-force.
const SALT_ROUNDS = 12;

// Set to keep track of connected users
const connectedUsers = new Set();

// Main function
async function main() {
  // Open the SQLite database
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  // Create necessary tables if they don't exist
  await db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, username TEXT, content TEXT)');
  await db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)');
  await db.run('CREATE TABLE IF NOT EXISTS private_messages (id INTEGER PRIMARY KEY, sender TEXT, receiver TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');

  // Create an Express app
  const app = express();
  const server = createServer(app);
  const io = new Server(server, { connectionStateRecovery: {} });

  // Parse POST bodies (built into Express since 4.16, no extra dependency needed)
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Serve the index.html file
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  // Retrieve the list of users
  app.get('/users', async (req, res) => {
    try {
      const users = await db.all('SELECT username FROM users');
      res.status(200).json(users);
    } catch (e) {
      res.status(500).send('Error retrieving users');
    }
  });

  // User registration
  // Passwords are never stored as-is: only their bcrypt hash is persisted.
  app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }
    if (password.length < 8) {
      return res.status(400).send('Password must be at least 8 characters long');
    }

    try {
      // bcrypt generates a unique salt per password, so two identical
      // passwords produce different hashes and cannot be compared or
      // cracked with a single precomputed table.
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, passwordHash);
      res.status(201).send('User registered successfully');
    } catch (e) {
      // The PRIMARY KEY constraint on username is what guarantees uniqueness,
      // so we let the database decide rather than checking beforehand.
      if (e && e.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).send('This username is already taken');
      }
      res.status(500).send('Error registering user');
    }
  });

  // User login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    try {
      // The password is no longer part of the query: we look the user up by
      // name, then verify the submitted password against the stored hash.
      const user = await db.get('SELECT username, password FROM users WHERE username = ?', username);
      const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

      if (!passwordMatches) {
        // Same message whether the user exists or not, so the response
        // cannot be used to enumerate valid accounts.
        return res.status(401).send('Invalid username or password');
      }

      connectedUsers.add(username);
      io.emit('user list', Array.from(connectedUsers));
      io.emit('login success', username);
      res.status(200).send('User logged in successfully');
    } catch (e) {
      res.status(500).send('Error logging in');
    }
  });

  // Socket.io connection event
  io.on('connection', async (socket) => {
    socket.on('user connected', (username) => {
      socket.username = username;
      io.emit('chat message', {username: 'System', content: socket.username + ' s\'est connecté(e)'});
      connectedUsers.add(username);
      io.emit('user list', Array.from(connectedUsers));
    });

    socket.on('typing', (username) => {
      socket.broadcast.emit('user typing', username);
    });

    socket.on('stop typing', (username) => {
      socket.broadcast.emit('user stop typing', username);
    });
    
    socket.on('private message', async (msg) => {
      try {
        await db.run('INSERT INTO private_messages (sender, receiver, message) VALUES (?, ?, ?)', msg.sender, msg.receiver, msg.message);
        console.log('Private message inserted');
        io.to(msg.receiver).emit('private message', msg);
      } catch (e) {
        console.error('Error inserting private message:', e);
        return;
      }
    });

    app.get('/private-messages/:user1/:user2', async (req, res) => {
      try {
        const messages = await db.all('SELECT * FROM private_messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY timestamp', req.params.user1, req.params.user2, req.params.user2, req.params.user1);
        res.status(200).json(messages);
      } catch (e) {
        res.status(500).send('Error retrieving private messages');
      }
    });

    socket.on('disconnect', () => {
      if (socket.username) {
        connectedUsers.delete(socket.username);
        io.emit('user list', Array.from(connectedUsers));
        io.emit('chat message', {username: 'System', content: socket.username + ' s\'est déconnecté(e)'});
      }
    });
    
    socket.on('chat message', async (msg) => {
      console.log('Received message:', msg);
      try {
        await db.run('INSERT INTO messages (username, content) VALUES (?, ?)', msg.username, msg.content);
        const { lastID } = db;
        console.log('Inserted message with ID:', lastID);
        io.emit('chat message', msg, lastID);
      } catch (e) {
        console.error('Error inserting message:', e);
        return;
      }
    });

    if (!socket.recovered) {
      try {
        await db.each('SELECT id, username, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', {username: row.username, content: row.content}, row.id);
          }
        )
      } catch (e) {
        // Handle error
      }
    }
  });

  // Start the server
  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

// Call the main function
main();