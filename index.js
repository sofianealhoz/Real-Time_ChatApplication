// Importing required modules
const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bodyParser = require('body-parser');

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

  // Configure body-parser middleware to parse POST requests
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

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
  app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, password);
      res.status(200).send('User registered successfully');
    } catch (e) {
      res.status(500).send('Error registering user');
    }
  });

  // User login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', username, password);
      if (user) {
        connectedUsers.add(username);
        io.emit('user list', Array.from(connectedUsers));
        io.emit('login success', username);
        res.status(200).send('User logged in successfully');
      } else {
        res.status(401).send('Invalid username or password');
      }
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