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
  const artists = await Artist.find({});

  const map = {};
  for (const a of artists) {
    map[a.normalizedName] = a._id;
  }

  for (const track of tracks) {
    const mainArtistId = map[normalize(track.artist)];
    const featureIds = (track.features || [])
      .map(f => map[normalize(f)])
      .filter(Boolean);

    track.artistRef = mainArtistId;
    track.featureRefs = featureIds;

    await track.save();
  }

  console.log('✅ Tracks migrate cu referințe');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
