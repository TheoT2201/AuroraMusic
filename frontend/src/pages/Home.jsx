import { useEffect, useState } from 'react';
import { getTracks } from '../services/api';
import TrackCard from '../components/TrackCard';

function Home() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    getTracks().then(setTracks);
  }, []);

  return (
    <div>
      <h2>Piese</h2>
      {tracks.map(track => (
        <TrackCard key={track._id} track={track} />
      ))}
    </div>
  );
}

export default Home;
