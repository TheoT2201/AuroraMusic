export default function Player({ track }) {
  if (!track) return null;

  return (
    <div className="player">
      <div>
        <strong>{track.title}</strong>
        <p>{track.artistRef?.name}</p>
      </div>

      <audio controls src={track.streamUrl} autoPlay />
    </div>
  );
}
