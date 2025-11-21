require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DB_SOURCE = process.env.DB_SOURCE || './movies.db'; // fallback jika env kosong

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.message);
        throw err;
    } else {
        console.log('✅ Terhubung ke basis data SQLite.');

        // === Tabel Movies ===
        db.run(`CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            director TEXT NOT NULL,
            year INTEGER NOT NULL
        )`, (err) => {
            if (err) {
                console.error("Error membuat tabel movies:", err.message);
            }
        });

        // === Tabel Directors ===
        db.run(`CREATE TABLE IF NOT EXISTS directors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            birthYear INTEGER NOT NULL
        )`, (err) => {
            if (err) {
                console.error("Error membuat tabel directors:", err.message);
            }
        });

        // === Tabel Users ===
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user'
        )`, (err) => {
            if (err) {
                console.error("Gagal membuat tabel users:", err.message);
            } else {
                console.log("✅ Tabel users siap digunakan.");
            }
        });
    }
});

module.exports = db;
