const mongoose = require('mongoose');
const Track = require('./models/Track');

const MONGO_URI = 'mongodb://127.0.0.1:27017/musicdb';

// aliasuri pentru normalizare
const ARTIST_ALIASES = new Map([
  ['ab soul', 'Ab-Soul'],
  ['ab-soul', 'Ab-Soul'],
  ['bj the chicago kid', 'BJ The Chicago Kid'],
  ['u.n.i', 'U.N.I.'],
  ['glc', 'GLC'],
]);

function normalizeArtist(raw) {
  let s = raw.trim();
  s = s.replace(/^[\(\[]+|[\)\]]+$/g, '');
  s = s.replace(/\s+/g, ' ');

  const key = s.toLowerCase();
  if (ARTIST_ALIASES.has(key)) return ARTIST_ALIASES.get(key);

  // Title Case simplu
  return s
    .split(' ')
    .map(p => /^[A-Z0-9.\-]{2,}$/.test(p) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// extrage feat-uri din numele fișierului
function extractFromFilename(filename) {
  const name = filename.replace(/\.[^.]+$/, '');

  const regex = /[\(\[]\s*(?:feat|featuring|ft)\.?\s+([^\)\]]+)[\)\]]/i;
  const match = name.match(regex);
  if (!match) return [];

  const raw = match[1]
    .replace(/\s+and\s+/gi, ' & ')
    .replace(/\s*&\s*/g, ' & ')
    .replace(/\s*,\s*/g, ', ');

  const artists = raw
    .split(',')
    .flatMap(p => p.split('&'))
    .map(a => normalizeArtist(a))
    .filter(Boolean);

  // dedup
  const seen = new Set();
  return artists.filter(a => {
    const k = a.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✔ MongoDB conectat');

  const tracks = await Track.find({});
  const files = mongoose.connection.db.collection('audio.files');

  let updated = 0;

  for (const track of tracks) {
    if (track.features && track.features.length > 0) continue;

    const file = await files.findOne({ _id: track.audioFileId });
    if (!file || !file.filename) continue;

    const features = extractFromFilename(file.filename);
    if (features.length === 0) continue;

    track.features = features;
    await track.save();

    updated++;
    console.log(`✔ ${track.title} -> feat: ${features.join(', ')}`);
  }

  console.log(`✅ Gata. ${updated} piese actualizate`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Eroare:', err);
  process.exit(1);
});
