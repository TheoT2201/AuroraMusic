import { useEffect, useState } from "react";

export default function Playlists() {
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


  return (
    <div className="page">
      <h2>📁 Playlists</h2>

      {/* CREATE */}
      <div className="playlist-create">
        <input
          placeholder="Nume playlist"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={createPlaylist}>Create</button>
      </div>

      {/* LIST */}
      <ul className="playlist-list">
        {playlists.map(p => (
          <li
            key={p._id}
            className={selected?._id === p._id ? "active" : ""}
            onClick={() => selectPlaylist(p._id)}
          >
            {p.name} ({p.tracks.length})
          </li>
        ))}
      </ul>

      {/* DETAILS */}
      {selected && (
        <div className="playlist-details">
          <h3>{selected.name}</h3>

          {selected.tracks.length === 0 && (
            <p>Playlist gol</p>
          )}

          <ul>
            {selected.tracks.map((t, index) => (
                <li key={index}>
                  🎵 <strong>{t.trackId.title}</strong>
                  {" — "}
                  {t.trackId.artistRef?.name || t.trackId.artist}
                </li>
            ))}
          </ul>

        </div>
      )}
    </div>
  );
}
