const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  season: Number,
  episodeNumber: Number,
  title: String,
  broadcastDate: Date,
  colors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
});

module.exports = mongoose.model('Episode', episodeSchema);