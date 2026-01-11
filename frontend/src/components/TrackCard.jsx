function TrackCard({ track }) {
  return (
    <div className="track-card">
      <img src={track.coverUrl} alt="" />
      <h4>{track.title}</h4>
      <p>{track.artist.name}</p>
    </div>
  );
}

export default TrackCard;
