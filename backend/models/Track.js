const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  features: [{ type: String }],
  artistRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  featureRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
  album: { type: String },
  genre: { type: String },
  year: { type: Number },
  duration: { type: Number },
  audioFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  mimeType: { type: String },
  playCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});



// Indexuri (le folosim mai târziu)
trackSchema.index({ artist: 1, album: 1, title: 1 });
trackSchema.index({ genre: 1, year: -1 });
trackSchema.index({ title: 'text', artist: 'text' });
trackSchema.index({ playCount: -1 });

module.exports = mongoose.model('Track', trackSchema);
