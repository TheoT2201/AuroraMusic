const mongoose = require('mongoose');
const Track = require('./models/Track');
const Artist = require('./models/Artist');

const MONGO_URI = 'mongodb://127.0.0.1:27017/musicdb';

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[\.\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✔ MongoDB conectat');

  const tracks = await Track.find({});
  console.log(`🎵 Tracks găsite: ${tracks.length}`);

  const artistMap = new Map();

  for (const t of tracks) {
    // artist principal (string vechi)
    if (t.artist) {
      artistMap.set(normalize(t.artist), t.artist);
    }

    // feat-uri (string vechi)
    if (Array.isArray(t.features)) {
      for (const f of t.features) {
        artistMap.set(normalize(f), f);
      }
    }
  }

  console.log(`🎤 Artiști unici detectați: ${artistMap.size}`);

  let created = 0;

  for (const [norm, name] of artistMap.entries()) {
    const exists = await Artist.findOne({ normalizedName: norm });
    if (exists) continue;

    await Artist.create({
      name,
      normalizedName: norm,
      aliases: []
    });

    created++;
    console.log(`✔ Artist creat: ${name}`);
  }

  console.log(`✅ Artiști creați: ${created}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
