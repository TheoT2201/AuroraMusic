import { useEffect, useState } from "react";

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/playlists")
      .then(res => res.json())
      .then(data => setPlaylists(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="page">
      <h2>📁 Playlists</h2>

      {playlists.length === 0 && (
        <p>Nu există playlist-uri încă.</p>
      )}

      <ul className="playlist-list">
        {playlists.map(p => (
          <li key={p._id} className="playlist-item">
            <strong>{p.name}</strong>
            <span>{p.tracks.length} melodii</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
