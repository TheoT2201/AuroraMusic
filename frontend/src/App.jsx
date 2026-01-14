import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';

import Home from './pages/Home';
import Playlists from './pages/Playlists';
import Library from "./pages/Library";

import './styles/app.css';

export default function App() {
  const [search, setSearch] = useState('');
  const [playlistQueue, setPlaylistQueue] = useState(null);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [autoplay, setAutoplay] = useState(false);

  const playingTrack = playlistQueue
    ? playlistQueue[playlistIndex]
    : currentTrack;


  return (
    <div className="app">
      <Sidebar />

      <main>
        <Header search={search} setSearch={setSearch} />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                search={search}
                setCurrentTrack={setCurrentTrack}
                setAutoplay={setAutoplay}
                playlistQueue={playlistQueue}
                playlistIndex={playlistIndex}
                setPlaylistIndex={setPlaylistIndex}
                clearPlaylist={() => setPlaylistQueue(null)}
              />
            }
          />

          <Route
            path="/playlists"
            element={
              <Playlists
                setPlaylistQueue={setPlaylistQueue}
                setPlaylistIndex={setPlaylistIndex}
              />
            }
          />

          <Route path="/library" element={<Library />} />
        </Routes>

        <Player
          track={playingTrack}
          autoplay={autoplay || Boolean(playlistQueue)}
          onAutoplayConsumed={() => setAutoplay(false)}
          onEnded={() => {
            if (playlistQueue && playlistIndex < playlistQueue.length - 1) {
              setPlaylistIndex(playlistIndex + 1);
            } else {
              setPlaylistQueue(null);
            }
          }}
        />

      </main>
    </div>
  );
}
