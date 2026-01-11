const express = require('express');
const multer = require('multer');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const Track = require('../models/Track');

const router = express.Router();

// === CONFIG MONGO ===
const mongoURI = 'mongodb://127.0.0.1:27017/musicdb';

// Refolosim conexiunea ca să nu ne conectăm la fiecare request
let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = await MongoClient.connect(mongoURI);
  }
  return cachedClient.db('musicdb');
}

// === MULTER: stocare în memorie (buffer) ===
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * CREATE: POST /api/tracks
 * Body: form-data
 *  - audio (File)
 *  - title, artist, album, genre, year, duration (Text)
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fișier audio lipsă' });
    }

    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: 'audio' });

    // creăm un stream de upload către GridFS
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype
    });

    // trimitem buffer-ul din memorie către GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on('error', (err) => {
      console.error('Eroare la upload în GridFS:', err);
      return res.status(500).json({ error: 'Eroare la stocarea fișierului audio' });
    });

    uploadStream.on('finish', async () => {
      try {
        const audioFileId = uploadStream.id;

        let features = [];
        if (req.body.features) {
          features = req.body.features
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }

        const track = await Track.create({
          title: req.body.title,
          artist: req.body.artist,
          album: req.body.album,
          genre: req.body.genre,
          year: req.body.year ? Number(req.body.year) : undefined,
          duration: req.body.duration ? Number(req.body.duration) : undefined,
          audioFileId,
          mimeType: req.file.mimetype,
          features
        });

        return res.status(201).json(track);
      } catch (err) {
        console.error('Eroare la salvarea metadatelor:', err);
        return res.status(500).json({ error: 'Eroare la salvarea metadatelor' });
      }
    });
  } catch (err) {
    console.error('Eroare generală la POST /tracks:', err);
    return res.status(500).json({ error: 'Eroare server' });
  }
});

/**
 * READ: GET /api/tracks
 * Listă simplă de melodii
 */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.artist) {
      filter.$or = [
        { artist: req.query.artist },
        { featuringArtists: req.query.artist }
      ];
    }
    if (req.query.genre) filter.genre = req.query.genre;

    const tracks = await Track.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(tracks);
  } catch (err) {
    console.error('Eroare la listare tracks:', err);
    res.status(500).json({ error: 'Eroare la listare' });
  }
});


/**
 * READ: GET /api/tracks/:id
 * Detalii track
 */
router.get('/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track negăsit' });
    res.json(track);
  } catch (err) {
    console.error('Eroare la get track:', err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

/**
 * READ: GET /api/tracks/:id/stream
 * Stream audio din GridFS
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track negăsit' });

    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: 'audio' });

    res.set('Content-Type', track.mimeType || 'audio/mpeg');

    bucket
      .openDownloadStream(track.audioFileId)
      .on('error', (err) => {
        console.error('Eroare la streaming:', err);
        res.status(500).json({ error: 'Eroare la streaming' });
      })
      .pipe(res);
  } catch (err) {
    console.error('Eroare la stream track:', err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

/**
 * UPDATE: PUT /api/tracks/:id
 */
router.put('/:id', async (req, res) => {
  try {
    if (req.body.features) {
      req.body.featuringArtists = req.body.features
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      delete req.body.features; // nu vrem câmp extra în DB
    }

    const updated = await Track.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Track negăsit' });
    res.json(updated);
  } catch (err) {
    console.error('Eroare la update track:', err);
    res.status(500).json({ error: 'Eroare server' });
  }
});


/**
 * DELETE: DELETE /api/tracks/:id
 * Șterge metadate + fișierul din GridFS
 */
router.delete('/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track negăsit' });

    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: 'audio' });

    await bucket.delete(track.audioFileId);
    await Track.deleteOne({ _id: track._id });

    res.json({ message: 'Track șters' });
  } catch (err) {
    console.error('Eroare la delete track:', err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

module.exports = router;
