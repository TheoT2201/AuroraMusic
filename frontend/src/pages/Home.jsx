import { useEffect, useState } from 'react';
import TrackGrid from '../components/TrackGrid';
import Player from '../components/Player';

export default function Home({ search }) {
  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [autoplay, setAutoplay] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlists, setPlaylists] = useState([]);



  useEffect(() => {
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tracks/search?q=${search}`);
        const data = await res.json();

        const normalized = (data || []).map(t => ({
          ...t,
          streamUrl: t.streamUrl || `/api/tracks/${t._id}/stream`,
        }));

        setTracks(normalized);

        setCurrent(prev =>
          prev && normalized.find(t => t._id === prev._id) ? prev : null
        );


      } catch (err) {
        console.error('Search error:', err);
        setTracks([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  const MAX_TRACKS = 18;

  const openPlaylistPicker = async (track) => {
    setSelectedTrack(track);

    const res = await fetch("http://localhost:3000/api/playlists");
    const data = await res.json();

    setPlaylists(data);
    setShowPlaylistPicker(true);
  };

  const addTrackToPlaylist = async (playlistId) => {
    await fetch(
      `http://localhost:3000/api/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: selectedTrack._id })
      }
    );

    setShowPlaylistPicker(false);
    setSelectedTrack(null);
  };




  return (
    <div className="page">
      <h2 className="page-title">🏠 Home</h2>

      <TrackGrid
        tracks={tracks.slice(0, MAX_TRACKS)}
        onPlay={(t) => {
          setCurrent(t);
          setAutoplay(true);
        }}
        onAddToPlaylist={openPlaylistPicker}
      />

      <Player track={current} autoplay={autoplay} onAutoplayConsumed={() => setAutoplay(false)} />
      {showPlaylistPicker && (
        <div className="playlist-picker-overlay">
          <div className="playlist-picker">
            <h3>Adaugă în playlist</h3>
            
            {playlists.map(p => (
              <button
                key={p._id}
                onClick={() => addTrackToPlaylist(p._id)}
              >
                {p.name}
              </button>
            ))}
      
            <button
              className="cancel"
              onClick={() => setShowPlaylistPicker(false)}
            >
              Anulează
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
