const mongoose = require('mongoose');


const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  genre: [String],
  director: String,
  year: Number,
  duration: Number,
  rate: Number,
  poster: String
});

module.exports = mongoose.model('Movie', movieSchema);
