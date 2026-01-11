import { useEffect, useState } from 'react';
import { getTracks } from '../services/api';
import TrackGrid from '../components/TrackGrid';
import Player from '../components/Player';

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    getTracks().then(setTracks);
  }, []);

  useEffect(() => {
  getTracks().then(data => {
    console.log('TOTAL TRACKS:', data.length);
    data.forEach(t =>
      console.log(t.title, '—', t.artistRef?.name)
    );
    setTracks(data);
    });
}, []);



  return (
    <>
      <h2 className="page-title">Piese</h2>
      <TrackGrid tracks={tracks} onPlay={setCurrent} />
      <Player track={current} />
    </>
  );
}
