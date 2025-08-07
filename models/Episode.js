const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: String,
  hex: String
}, { _id: false });

const episodeSchema = new mongoose.Schema({
  title: String,
  season: Number,
  episode: Number,
  youtubeSrc: String,
  imageSrc: String,
  colors: [colorSchema],
  subjects: [String],
  date: Date
});

module.exports = mongoose.model('Episode', episodeSchema);