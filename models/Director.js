// models/Director.js
const mongoose = require('mongoose');

// Definisi skema sutradara
const directorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama sutradara wajib diisi'],
      trim: true
    },
    birthYear: {
      type: Number,
      validate: {
        validator: (v) => v >= 1800 && v <= new Date().getFullYear(),
        message: 'Tahun lahir tidak valid'
      }
    }
  },
  { timestamps: true } // otomatis buat createdAt & updatedAt
);

// Buat model Mongoose bernama 'Director'
const Director = mongoose.model('Director', directorSchema);

module.exports = Director;
