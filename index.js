const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bodyParser = require('body-parser'); 


async function main() {
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  await db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, username TEXT, content TEXT)');
  await db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)');
  db.run(`delete from messages`);

  const app = express();
  const server = createServer(app);
  const io = new Server(server, { connectionStateRecovery: {} });

  app.use(bodyParser.urlencoded({ extended: false })); // Ajouté pour analyser les requêtes POST
  app.use(bodyParser.json()); // Ajouté pour analyser les requêtes POST
  
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  // Inscription
  app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
      // Insérer le nouvel utilisateur dans la base de données
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, password);
      res.status(200).send('User registered successfully');
    } catch (e) {
      // Envoyer une erreur si l'inscription échoue
      res.status(500).send('Error registering user');
    }
  });

  // Connexion
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      // Vérifier les informations d'authentification
      const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', username, password);
      if (user) {
        res.status(200).send('User logged in successfully');
      } else {
        res.status(401).send('Invalid username or password');
      }
    } catch (e) {
      // Envoyer une erreur si la connexion échoue
      res.status(500).send('Error logging in');
    }
  });

  io.on('connection', async (socket) => {
    io.emit('chat message', {username: 'System', content: 'Un nouvel utilisateur s\'est connecté'});
    socket.on('disconnect', () => {
      io.emit('chat message', {username: 'System', content: 'Un utilisateur s\'est déconnecté'});
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
        // something went wrong
      }
    }
  });

  server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });
}

main();