export default function TrackCard({ track, onPlay, onAddToPlaylist }) {
  return (
    <div className="track-card">
      <div className="cover" onClick={() => onPlay(track)}>
        <span className="play">▶</span>
      </div>

      <div className="meta">
        <h4>{track.title}</h4>
        <p>{track.artistRef?.name || track.artist}</p>
      </div>

      <button
        className="add-btn"
        onClick={(e) => {
          e.stopPropagation();
          onAddToPlaylist(track);
        }}
      >
        ➕
      </button>
    </div>
  );
}
