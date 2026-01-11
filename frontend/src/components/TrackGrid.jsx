import TrackCard from './TrackCard';

export default function TrackGrid({ tracks, onPlay }) {
  return (
    <div className="grid">
      {tracks.map(t => (
        <TrackCard key={t._id} track={t} onPlay={onPlay} />
      ))}
    </div>
  );
}
