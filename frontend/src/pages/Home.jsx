import { useEffect, useState } from 'react';
import TrackGrid from '../components/TrackGrid';
import Player from '../components/Player';

export default function Home({ search }) {
  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [autoplay, setAutoplay] = useState(false);


  useEffect(() => {
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tracks/search?q=${search}`);
        const data = await res.json();

        const normalized = (data || []).map(t => ({
          ...t,
          streamUrl: t.streamUrl || `/api/tracks/${t._id}/stream`,
        }));

        setTracks(normalized);

        setCurrent(prev =>
          prev && normalized.find(t => t._id === prev._id) ? prev : null
        );


      } catch (err) {
        console.error('Search error:', err);
        setTracks([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  const MAX_TRACKS = 18;

  return (
    <>
      <h2 className="page-title">🎧 Piese</h2>

      <TrackGrid
        tracks={tracks.slice(0, MAX_TRACKS)}
        onPlay={(t) => {
          setCurrent(t);
          setAutoplay(true);
        }}
      />

      <Player track={current} autoplay={autoplay} onAutoplayConsumed={() => setAutoplay(false)} />
    </>
  );
}
