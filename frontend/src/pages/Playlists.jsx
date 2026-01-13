import { useEffect, useState } from "react";
import TrackCard from "../components/TrackCard";

export default function Playlists({ setPlaylistQueue, setPlaylistIndex }) {
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(null);

  const loadPlaylists = () => {
    fetch("http://localhost:3000/api/playlists")
      .then(res => res.json())
      .then(data => setPlaylists(data));
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const createPlaylist = async () => {
    if (!name.trim()) return;

    await fetch("http://localhost:3000/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    setName("");
    loadPlaylists();
  };

  const selectPlaylist = async (playlistId) => {
    const res = await fetch(
      `http://localhost:3000/api/playlists/${playlistId}`
    );
    const data = await res.json();
    setSelected(data);
  };

  const removeTrackFromPlaylist = async (track) => {
    if (!selected) return;

    await fetch(
      `http://localhost:3000/api/playlists/${selected._id}/tracks/${track._id}`,
      { method: "DELETE" }
    );

    // reîncarcă playlist-ul selectat
    selectPlaylist(selected._id);
  };

  const deletePlaylist = async () => {
    if (!selected) return;

    const ok = window.confirm(
      `Ștergi playlist-ul "${selected.name}"?`
    );
    if (!ok) return;

    await fetch(
      `http://localhost:3000/api/playlists/${selected._id}`,
      { method: "DELETE" }
    );

    setSelected(null);
    loadPlaylists();
  };

  const playPlaylist = () => {
    if (!selected || selected.tracks.length === 0) return;

    const tracks = selected.tracks.map(t => ({
      ...t.trackId,
      streamUrl: `/api/tracks/${t.trackId._id}/stream`
    }));

    setPlaylistQueue(tracks);
    setPlaylistIndex(0);
  };

  const playFromPlaylist = (track) => {
    const tracks = selected.tracks.map(t => ({
      ...t.trackId,
      streamUrl: `/api/tracks/${t.trackId._id}/stream`
    }));

    const index = tracks.findIndex(t => t._id === track._id);
    if (index === -1) return;

    setPlaylistQueue(tracks);
    setPlaylistIndex(index);
  };


  return (
    <div className="page">
      <h2>📁 Playlists</h2>

      {/* CREATE */}
      <div className="playlist-create">
        <input
          placeholder="Create new playlist..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={createPlaylist}>＋</button>
      </div>

      {/* LIST */}
      <div className="playlist-cards">
        {playlists.map(p => (
            <div
              key={p._id}
              className={`playlist-card ${selected?._id === p._id ? "active" : ""}`}
              onClick={() => selectPlaylist(p._id)}
            >
              <strong>{p.name}</strong>
              <span>{p.tracks.length} tracks</span>
            </div>
        ))}
      </div>


      {/* DETAILS */}
      {selected && (
        <div className="playlist-details">
          <div className="playlist-details-header">
            <h3>{selected.name}</h3>
            
            <div className="playlist-actions">
              <button className="playlist-play-btn" onClick={playPlaylist}>
                ▶ Play
              </button>
            
              <button
                className="delete-playlist-btn"
                onClick={deletePlaylist}
                title="Delete playlist"
              >
                🗑️
              </button>
            </div>
          </div>
            
          {selected.tracks.length === 0 && (
            <p>Playlist gol</p>
          )}
        
          <div className="grid">
            {selected.tracks.map(t => (
              <TrackCard
                key={t.trackId._id}
                track={t.trackId}
                onPlay={playFromPlaylist}
                onAddToPlaylist={() => {}}
                onRemoveFromPlaylist={removeTrackFromPlaylist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
