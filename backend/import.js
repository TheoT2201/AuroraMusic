const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
const Track = require('./models/Track');

// ================= CONFIG =================
const MUSIC_ROOT = path.join(os.homedir(), 'Music');
const MONGO_URI = 'mongodb://127.0.0.1:27017/musicdb';

// cache pentru aceeași rulare
const processedCache = new Set();

// ================= DB =================
async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log('✔ MongoDB conectat');
}

// ================= GRIDFS =================
function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'audio'
  });
}

// ================= NORMALIZARE ARTISTI =================
const ARTIST_ALIASES = new Map([
  ['ab soul', 'Ab-Soul'],
  ['ab-soul', 'Ab-Soul'],
  ['bj the chicago kid', 'BJ The Chicago Kid'],
  ['u.n.i', 'U.N.I.'],
  ['glc', 'GLC']
]);

function normalizeArtist(name) {
  let s = name.trim();
  s = s.replace(/^[\(\[]+|[\)\]]+$/g, '');
  s = s.replace(/\s+/g, ' ');

  const key = s.toLowerCase();
  if (ARTIST_ALIASES.has(key)) return ARTIST_ALIASES.get(key);

  return s
    .split(' ')
    .map(p =>
      /^[A-Z0-9.\-]{2,}$/.test(p)
        ? p.toUpperCase()
        : p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join(' ');
}

// ================= PARSARE ALBUM =================
function parseAlbumFolder(folderName) {
  const match = folderName.match(/^(\d{4})\s*-\s*(.+)$/);
  if (!match) return {};
  return {
    year: Number(match[1]),
    album: match[2]
  };
}

// ================= PARSARE TRACK =================
function parseTrackFile(fileName) {
  const base = path.parse(fileName).name;

  let title = base;
  let features = [];

  const featRegex = /[\(\[]\s*(?:feat|featuring|ft)\.?\s+([^\)\]]+)[\)\]]/i;
  const match = base.match(featRegex);

  if (match) {
    let raw = match[1]
      .replace(/\s+and\s+/gi, ' & ')
      .replace(/\s*&\s*/g, ' & ')
      .replace(/\s*,\s*/g, ', ');

    features = raw
      .split(',')
      .flatMap(p => p.split('&'))
      .map(normalizeArtist)
      .filter(Boolean);

    title = base.replace(featRegex, '').trim();
  }

  // elimină număr track
  title = title.replace(/^\s*\d+\s*[\.\-]?\s*/, '').trim();
  title = title.replace(/\s+/g, ' ');

  // dedup features
  const seen = new Set();
  features = features.filter(a => {
    const k = a.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { title, features };
}

// ================= IMPORT =================
async function importMusic() {
  const bucket = getBucket();
  const artists = fs.readdirSync(MUSIC_ROOT);

  for (const artist of artists) {
    const artistPath = path.join(MUSIC_ROOT, artist);
    if (!fs.statSync(artistPath).isDirectory()) continue;

    const albumsPath = path.join(artistPath, 'Albums');
    if (!fs.existsSync(albumsPath)) continue;

    const albums = fs.readdirSync(albumsPath);

    for (const albumFolder of albums) {
      const albumPath = path.join(albumsPath, albumFolder);
      if (!fs.statSync(albumPath).isDirectory()) continue;

      const { album, year } = parseAlbumFolder(albumFolder);
      if (!album) continue;

      const files = fs.readdirSync(albumPath)
        .filter(f => /\.(mp3|m4a|wav)$/i.test(f));

      for (const file of files) {
        const filePath = path.join(albumPath, file);
        const { title, features } = parseTrackFile(file);

        const uniqueKey = `${artist}|${album}|${title}`.toLowerCase();

        // skip în aceeași rulare
        if (processedCache.has(uniqueKey)) {
          console.log(`⏭️ Skip (cache): ${artist} - ${title}`);
          continue;
        }

        // skip dacă există deja în DB
        const exists = await Track.findOne({ artist, album, title }).lean();
        if (exists) {
          console.log(`⏭️ Skip (DB): ${artist} - ${title}`);
          processedCache.add(uniqueKey);
          continue;
        }

        processedCache.add(uniqueKey);

        console.log(
          `🎵 Import: ${artist} - ${title}` +
          (features.length ? ` (feat. ${features.join(', ')})` : '')
        );

        const uploadStream = bucket.openUploadStream(file, {
          contentType: file.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg'
        });

        fs.createReadStream(filePath).pipe(uploadStream);

        await new Promise((resolve, reject) => {
          uploadStream.on('finish', async () => {
            try {
              await Track.create({
                title,
                artist,
                features,
                album,
                year,
                audioFileId: uploadStream.id,
                mimeType: uploadStream.options.contentType
              });
              resolve();
            } catch (err) {
              // protecție finală (index unic)
              if (err.code === 11000) {
                console.log(`⏭️ Skip (index): ${artist} - ${title}`);
                resolve();
              } else {
                reject(err);
              }
            }
          });
          uploadStream.on('error', reject);
        });
      }
    }
  }
}

// ================= RUN =================
(async () => {
  try {
    await connectDB();
    await importMusic();
    console.log('✅ Import finalizat fără duplicate');
    process.exit(0);
  } catch (err) {
    console.error('❌ Eroare import:', err);
    process.exit(1);
  }
})();
