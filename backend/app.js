const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Track = require('./models/Track');

// Import rute
const trackRoutes = require('./routes/tracks');
const playlistsRoutes = require('./routes/playlists');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexiune MongoDB
const mongoURI = 'mongodb://127.0.0.1:27017/musicdb';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Conectat la MongoDB');

    await Track.syncIndexes();
    console.log('Track indexes synced');
  })
  .catch(err => console.error('Eroare conectare MongoDB:', err));

// Rute
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistsRoutes);

// Pornim serverul
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server pornit pe portul ${PORT}`);
});
