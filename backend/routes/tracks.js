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
      .limit(100)
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
    res.set('Content-Type', track.mimeType || 'audio/mpeg');
    res.set('Accept-Ranges', 'bytes');

    bucket.openDownloadStream(track.audioFileId).pipe(res);
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
