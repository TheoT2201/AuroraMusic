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

  const artists = await Artist.find({});
  const artistMap = {};

  for (const a of artists) {
    artistMap[a.normalizedName] = a._id;
  }

  const tracks = await Track.find({});
  let updated = 0;

  for (const t of tracks) {
    let changed = false;

    if (t.artist) {
      const id = artistMap[normalize(t.artist)];
      if (id && (!t.artistRef || !t.artistRef.equals(id))) {
        t.artistRef = id;
        changed = true;
      }
    }

    if (Array.isArray(t.features)) {
      const ids = t.features
        .map(f => artistMap[normalize(f)])
        .filter(Boolean);

      const same =
        Array.isArray(t.featureRefs) &&
        ids.length === t.featureRefs.length &&
        ids.every((id, i) => t.featureRefs[i]?.equals(id));

      if (!same) {
        t.featureRefs = ids;
        changed = true;
      }
    }

    if (changed) {
      await t.save();
      updated++;
    }
  }

  console.log(`✅ Tracks actualizate: ${updated}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
