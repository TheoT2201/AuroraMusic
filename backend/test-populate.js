const mongoose = require('mongoose');
const Track = require('./models/Track');
require('./models/Artist');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/musicdb');

  const tracks = await Track
    .find()
    .populate('artistRef featureRefs');

  const artists = new Set();

  for (const t of tracks) {
    if (t.artistRef) artists.add(t.artistRef.name);
    for (const f of t.featureRefs || []) {
      artists.add(f.name);
    }
  }

  console.log('🎤 Artiști găsiți:');
  console.log([...artists].sort());

  console.log(`\nTotal artiști unici: ${artists.size}`);
  process.exit(0);
}

run();
