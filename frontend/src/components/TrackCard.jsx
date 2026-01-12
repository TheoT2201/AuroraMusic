export default function TrackCard({ track, onPlay }) {
  return (
    <div className="track-card" onClick={() => onPlay(track)}>
      <div className="cover">
        <span className="play">▶</span>
      </div>

      <div className="meta">
        <h4 title={track.title}>{track.title}</h4>
        <p>{track.artistRef?.name || track.artist}</p>
      </div>
    </div>
  );
}
