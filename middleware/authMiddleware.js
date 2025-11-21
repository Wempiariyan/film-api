const jwt = require('jsonwebtoken');

// Gunakan JWT_SECRET dari .env, atau fallback sementara
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';

// === Middleware Autentikasi ===
// Memastikan pengguna memiliki token JWT yang valid
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Harap login dulu.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
    }

    // Simpan data user (id, username, role) dari payload ke req.user
    req.user = decodedPayload.user;
    next();
  });
}

// === Middleware Autorisasi ===
// Mengecek apakah peran user sesuai (misal hanya admin boleh delete)
function authorizeRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User belum terautentikasi.' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin yang cukup.' });
    }

    next(); // lanjut ke handler berikutnya
  };
}

module.exports = { authenticateToken, authorizeRole };
