const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Track = require('../models/Track');
const Artist = require('../models/Artist');

const router = express.Router();

// ================= MULTER =================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================= GRIDFS =================
function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'audio'
  });
}

// ================= UTILS =================
function normalize(name) {
  return name.toLowerCase().replace(/[\.\-]/g, '').trim();
}

// ================= CREATE =================
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fișier audio lipsă' });
    }

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('error', err => {
      console.error(err);
      return res.status(500).json({ error: 'Eroare upload audio' });
    });

    uploadStream.on('finish', async () => {
      try {
        // === ARTIST PRINCIPAL ===
        const mainArtistName = req.body.artist;
        const mainNorm = normalize(mainArtistName);

        let mainArtist = await Artist.findOne({ normalizedName: mainNorm });
        if (!mainArtist) {
          mainArtist = await Artist.create({
            name: mainArtistName,
            normalizedName: mainNorm
          });
        }

        // === FEATURI ===
        let featureRefs = [];
        let features = [];

        if (req.body.features) {
          features = req.body.features
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

          for (const f of features) {
            const norm = normalize(f);
            let a = await Artist.findOne({ normalizedName: norm });
            if (!a) {
              a = await Artist.create({ name: f, normalizedName: norm });
            }
            featureRefs.push(a._id);
          }
        }

        const track = await Track.create({
          title: req.body.title,
          album: req.body.album,
          genre: req.body.genre,
          year: req.body.year ? Number(req.body.year) : undefined,
          duration: req.body.duration ? Number(req.body.duration) : undefined,
          audioFileId: uploadStream.id,
          mimeType: req.file.mimetype,

          // NOU
          artistRef: mainArtist._id,
          featureRefs,

          // vechi (compatibilitate)
          artist: mainArtist.name,
          features
        });

        res.status(201).json(track);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Eroare creare track' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// ================= READ ALL =================
router.get('/', async (req, res) => {
  try {
    const tracks = await Track.find()
      .populate('artistRef featureRefs')
      .sort({ createdAt: -1 })
      .lean();

    const withStreamUrl = tracks.map(t => ({
      ...t,
      streamUrl: `/api/tracks/${t._id}/stream`
    }));

    res.json(withStreamUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare listare tracks' });
  }
});

// ================= SEARCH =================
// GET /api/tracks/search?q=metal
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;

    let tracks;

    if (!q || q.trim() === '') {
      tracks = await Track.find()
        .populate('artistRef featureRefs')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      tracks = await Track.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
        .populate('artistRef featureRefs')
        .sort({ score: { $meta: "textScore" } })
        .lean();
    }

    const withStreamUrl = tracks.map(t => ({
      ...t,
      streamUrl: `/api/tracks/${t._id}/stream`,
    }));

    res.json(withStreamUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= READ ONE =================
router.get('/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id)
      .populate('artistRef featureRefs')
      .lean();

    if (!track) {
      return res.status(404).json({ error: 'Track negăsit' });
    }

    const withStreamUrl = {
      ...track,
      streamUrl: `/api/tracks/${track._id}/stream`
    };

    res.json(withStreamUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});


// ================= STREAM =================
router.get('/:id/stream', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track negăsit' });

    const bucket = getBucket();
    const range = req.headers.range;

    // luăm info despre fișier (length) din GridFS
    const files = await bucket.find({ _id: track.audioFileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Fișier audio lipsă în GridFS' });
    }

    const file = files[0];
    const fileSize = file.length;
    let contentType = 'audio/mpeg';

    if (track.mimeType === 'audio/mpeg' || track.mimeType === 'audio/mp3') {
      contentType = 'audio/mpeg';
    }

    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Type', contentType);

    // Dacă NU avem Range => trimitem tot fișierul normal
    if (!range) {
      res.set('Content-Length', String(fileSize));
      return bucket.openDownloadStream(track.audioFileId).pipe(res);
    }

    // Range: bytes=start-end
    const match = range.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      return res.status(416).send('Malformed Range header');
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = (end - start) + 1;

    res.status(206);
    res.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.set('Content-Length', String(chunkSize));

    // IMPORTANT: în driver-ul Mongo, end este de obicei EXCLUSIV.
    // De aceea folosim end + 1 ca să includem ultimul byte cerut.
    bucket.openDownloadStream(track.audioFileId, { start, end: end + 1 }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare streaming' });
  }
});



// ================= UPDATE =================
router.put('/:id', async (req, res) => {
  try {
    const updated = await Track.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('artistRef featureRefs');

    if (!updated) return res.status(404).json({ error: 'Track negăsit' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare update' });
  }
});


// ================= DELETE =================
router.delete('/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track negăsit' });

    const bucket = getBucket();
    try {
      await bucket.delete(track.audioFileId);
    } catch {
      console.warn('Fișier audio deja șters');
    }

    await Track.deleteOne({ _id: track._id });

    res.json({ message: 'Track șters' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare delete' });
  }
});

module.exports = router;
