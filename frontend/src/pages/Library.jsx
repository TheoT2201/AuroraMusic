import { useEffect, useState } from "react";

export default function Library() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/library/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => {
        console.error(err);
        setStats({
          totalTracks: 0,
          uniqueArtists: 0,
          uniqueAlbums: 0,
          totalDuration: 0,
          genres: [],
          years: []
        });
      });
  }, []);

  if (!stats) {
    return <div className="page">Loading Library...</div>;
  }

  const genres = stats.genres || [];
  const years = stats.years || [];

  const maxGenre = Math.max(1, ...genres.map(g => g.count));
  const maxYear = Math.max(1, ...years.map(y => y.count));


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

      <div className="library-panels">
            {/* TOP GENRES */}
            <section className="panel">
              <div className="panel-header">
                <span className="panel-icon">🏷️</span>
                <h3>Top Genres</h3>
              </div>

              <div className="rows">
                {stats.genres.length === 0 ? (
                  <p className="muted">No genres found</p>
                ) : (
                  stats.genres.map(g => (
                    <div key={g.genre} className="row">
                      <div className="row-top">
                        <span className="row-label">{g.genre}</span>
                        <span className="badge">{g.count}</span>
                      </div>

                      <div className="bar">
                        <div
                          className="bar-fill"
                          style={{ width: `${(g.count / maxGenre) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            
            {/* TRACKS BY YEAR */}
            <section className="panel">
              <div className="panel-header">
                <span className="panel-icon">📅</span>
                <h3>Tracks by Year</h3>
              </div>
            
              <div className="rows years-grid">
                {stats.years.length === 0 ? (
                  <p className="muted">No years found</p>
                ) : (
                  stats.years.map(y => (
                    <div key={y.year} className="year-row">
                      <div className="year-left">
                        <span className="year">{y.year}</span>
                        <span className="badge">{y.count}</span>
                      </div>

                      <div className="bar">
                        <div
                          className="bar-fill"
                          style={{ width: `${(y.count / maxYear) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
        </div>
    </div>
  );
}
