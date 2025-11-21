require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const { authenticateToken, authorizeRole } = require('./middleware/authMiddleware.js');

const app = express();
const PORT = process.env.PORT || 3300;
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';

// Middleware global
app.use(cors());
app.use(express.json()); // penting agar body JSON bisa dibaca

// ================= MIDDLEWARE LOGGER =================
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ================= STATUS =================
app.get('/status', (req, res) => {
  res.json({ ok: true, service: 'film-api' });
});

// ================= MOVIES =================
app.get('/movies', (req, res) => {
  const sql = 'SELECT * FROM movies ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/movies/:id', (req, res) => {
  const sql = 'SELECT * FROM movies WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.json(row);
  });
});

// POST (login diperlukan)
app.post('/movies', authenticateToken, (req, res) => {
  console.log('✅ Masuk ke POST /movies oleh:', req.user.username);
  console.log('Body:', req.body);

  // Cegah error kalau body kosong
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Body request tidak boleh kosong' });
  }

  const { title, director, year } = req.body;
  if (!title || !director || !year) {
    return res.status(400).json({ error: 'title, director, year wajib diisi' });
  }

  const sql = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
  db.run(sql, [title, director, year], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, director, year });
  });
});

// PUT & DELETE (admin only)
app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  console.log('✅ PUT /movies oleh:', req.user.username);

  const { title, director, year } = req.body;
  if (!title || !director || !year) {
    return res.status(400).json({ error: 'Semua field harus diisi' });
  }

  const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
  db.run(sql, [title, director, year, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.json({ id: Number(req.params.id), title, director, year });
  });
});

app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  console.log('✅ DELETE /movies oleh:', req.user.username);
  const sql = 'DELETE FROM movies WHERE id = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.status(204).send();
  });
});

// ================= DIRECTORS =================
app.get('/directors', (req, res) => {
  const sql = 'SELECT * FROM directors ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/directors/:id', (req, res) => {
  const sql = 'SELECT * FROM directors WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.json(row);
  });
});

app.post('/directors', authenticateToken, (req, res) => {
  console.log('✅ POST /directors oleh:', req.user.username);
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Body request tidak boleh kosong' });
  }

  const { name, birthYear } = req.body;
  if (!name || !birthYear) {
    return res.status(400).json({ error: 'name dan birthYear wajib diisi' });
  }

  const sql = 'INSERT INTO directors (name, birthYear) VALUES (?,?)';
  db.run(sql, [name, birthYear], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, birthYear });
  });
});

app.put('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  console.log('✅ PUT /directors oleh:', req.user.username);
  const { name, birthYear } = req.body;
  if (!name || !birthYear) {
    return res.status(400).json({ error: 'Semua field harus diisi' });
  }

  const sql = 'UPDATE directors SET name = ?, birthYear = ? WHERE id = ?';
  db.run(sql, [name, birthYear, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.json({ id: Number(req.params.id), name, birthYear });
  });
});

app.delete('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  console.log('✅ DELETE /directors oleh:', req.user.username);
  const sql = 'DELETE FROM directors WHERE id = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.status(204).send();
  });
});

// ================= AUTH =================
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Gagal memproses pendaftaran' });

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.run(sql, [username.toLowerCase(), hashedPassword, 'user'], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        return res.status(500).json({ error: 'Gagal menyimpan pengguna' });
      }
      res.status(201).json({ message: 'Registrasi berhasil', userId: this.lastID });
    });
  });
});

app.post('/auth/register-admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Gagal memproses pendaftaran' });

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.run(sql, [username.toLowerCase(), hashedPassword, 'admin'], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        return res.status(500).json({ error: 'Gagal menyimpan pengguna' });
      }
      res.status(201).json({ message: 'Admin berhasil dibuat', userId: this.lastID });
    });
  });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password harus diisi' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username.toLowerCase()], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Kredensial tidak valid' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ error: 'Kredensial tidak valid' });

      const payload = { user: { id: user.id, username: user.username, role: user.role } };
      jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) return res.status(500).json({ error: 'Gagal membuat token' });
        res.json({ message: 'Login berhasil', token });
      });
    });
  });
});

// ================= TEST ROUTE =================
app.get('/tesroute', (req, res) => {
  res.json({ message: 'Route test berhasil!' });
});

// ================= HANDLER 404 =================
app.use((req, res) => res.status(404).json({ error: 'Rute tidak ditemukan' }));

// ================= START SERVER =================
app.listen(PORT, () => console.log(`🚀 Server aktif di http://localhost:${PORT}`));
