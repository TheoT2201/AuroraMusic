export default function TrackCard({ track, onPlay }) {
  return (
    <div className="track-card" onClick={() => onPlay(track)}>
      <div className="cover">🎧</div>
      <h4>{track.title}</h4>
      <p>{track.artistRef?.name || track.artist || 'Unknown Artist'}</p>
    </div>
  );
}
