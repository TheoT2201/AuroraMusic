const mongoose = require('mongoose');
const Track = require('./models/Track');
const Artist = require('./models/Artist');

const MONGO_URI = 'mongodb://127.0.0.1:27017/musicdb';

function normalize(name) {
  return name.toLowerCase().replace(/[\.\-]/g, '').trim();
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✔ MongoDB conectat');

  const tracks = await Track.find({});
  const artistSet = new Map();

  for (const track of tracks) {
    // artist principal
    artistSet.set(normalize(track.artist), track.artist);

    // feat-uri
    for (const f of track.features || []) {
      artistSet.set(normalize(f), f);
    }
  }

  console.log(`🎤 Artiști detectați: ${artistSet.size}`);

  for (const [norm, name] of artistSet.entries()) {
    const exists = await Artist.findOne({ normalizedName: norm });
    if (exists) continue;

    await Artist.create({
      name,
      normalizedName: norm,
      aliases: []
    });

    console.log(`✔ Artist creat: ${name}`);
  }

  console.log('✅ Colecția artists creată');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
