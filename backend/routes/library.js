const express = require("express");
const Playlist = require("../models/Playlist");

const router = express.Router();

/**
 * GET /api/library/stats
 * Library = toate piesele din playlist-uri
 */
router.get("/stats", async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$tracks" },

      {
        $lookup: {
          from: "tracks",
          localField: "tracks.trackId",
          foreignField: "_id",
          as: "track"
        }
      },
      { $unwind: "$track" },

      {
        $group: {
          _id: "$track._id",
          title: { $first: "$track.title" },
          artist: { $first: "$track.artist" },
          album: { $first: "$track.album" },
          genre: { $first: "$track.genre" },
          year: { $first: "$track.year" },
          duration: { $first: "$track.duration" }
        }
      }
    ];

    const tracks = await Playlist.aggregate(pipeline);

    // === STATISTICI ===
    const totalTracks = tracks.length;

    const uniqueArtists = new Set(tracks.map(t => t.artist)).size;
    const uniqueAlbums = new Set(tracks.map(t => t.album)).size;

    const totalDuration = tracks.reduce(
      (sum, t) => sum + (t.duration || 0),
      0
    );

    // GENURI
    const genres = {};
    tracks.forEach(t => {
      if (!t.genre) return;
      genres[t.genre] = (genres[t.genre] || 0) + 1;
    });

    const genreStats = Object.entries(genres)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ANI
    const years = {};
    tracks.forEach(t => {
      if (!t.year) return;
      years[t.year] = (years[t.year] || 0) + 1;
    });

    const yearStats = Object.entries(years)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);

    res.json({
      totalTracks,
      uniqueArtists,
      uniqueAlbums,
      totalDuration,
      genres: genreStats,
      years: yearStats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Library stats failed" });
  }
});

module.exports = router;
