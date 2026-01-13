const express = require('express');
const Playlist = require('../models/Playlist');

const router = express.Router();

/**
 * CREATE playlist
 * POST /api/playlists
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    const playlist = new Playlist({
      name,
      description,
      tracks: []
    });

    await playlist.save();
    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET all playlists
 * GET /api/playlists
 */
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find();
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET playlist by ID (cu melodii populate)
 * GET /api/playlists/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('tracks.trackId');

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADD track to playlist
 * POST /api/playlists/:id/tracks
 */
router.post('/:id/tracks', async (req, res) => {
  try {
    const { trackId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const order = playlist.tracks.length + 1;

    playlist.tracks.push({ trackId, order });
    await playlist.save();

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * REMOVE track from playlist
 * DELETE /api/playlists/:id/tracks/:trackId
 */
router.delete('/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    playlist.tracks = playlist.tracks.filter(
      t => t.trackId.toString() !== req.params.trackId
    );

    // reordonare
    playlist.tracks.forEach((t, index) => {
      t.order = index + 1;
    });

    await playlist.save();
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE playlist
 * DELETE /api/playlists/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
