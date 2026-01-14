import { useEffect, useState } from "react";

export default function Library() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/library/stats")
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="page">Loading Library...</div>;

  return (
    <div className="page">
      <h2>🎵 Library</h2>

      <div className="stats-grid">
        <div className="stat-card">📊 <b>{stats.totalTracks}</b><br/>Tracks</div>
        <div className="stat-card">🎤 <b>{stats.uniqueArtists}</b><br/>Artists</div>
        <div className="stat-card">💿 <b>{stats.uniqueAlbums}</b><br/>Albums</div>
        <div className="stat-card">
          ⏱️ <b>{Math.round(stats.totalDuration / 60)}</b><br/>Minutes
        </div>
      </div>

      <h3>🏷️ Top Genres</h3>
      <ul>
        {stats.genres.map(g => (
          <li key={g.genre}>{g.genre} – {g.count}</li>
        ))}
      </ul>

      <h3>📅 Tracks by Year</h3>
      <ul>
        {stats.years.map(y => (
          <li key={y.year}>{y.year} – {y.count}</li>
        ))}
      </ul>
    </div>
  );
}
