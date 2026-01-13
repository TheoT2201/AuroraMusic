import { useEffect, useRef, useState } from "react";

export default function Player({ track, autoplay, onAutoplayConsumed, onEnded }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
  const audio = audioRef.current;
  if (!track || !audio) return;

  // reset doar la schimbarea piesei
  audio.currentTime = 0;
  setProgress(0);
  setPlaying(false);

  if (autoplay) {
    (async () => {
      try {
        await audio.play();
        // nu mai setăm manual playing aici neapărat; onPlay o va face
      } catch (err) {
        console.warn("Autoplay failed:", err);
      } finally {
        onAutoplayConsumed?.();
      }
    })();
  }
}, [track?._id]); // 👈 IMPORTANT: doar _id, fără autoplay



  const togglePlay = async () => {
  const audio = audioRef.current;
  if (!audio) return;

  try {
    if (!audio.paused) {
      audio.pause();
    } else {
      if (audio.readyState < 2) {
        await new Promise(resolve =>
          audio.addEventListener("canplay", resolve, { once: true })
        );
      }
      await audio.play();
    }
  } catch (err) {
    console.warn("Play failed:", err);
  }
};



  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const changeVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    // dacă nu e încă disponibilă durata, nu încerca seek
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const percent = rect.width ? x / rect.width : 0;

    audio.currentTime = percent * audio.duration;
    setProgress(percent * 100);
  };

  // AUDIO
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);



  if (!track) return null;


  return (
    <div className="player">
      <audio
        ref={audioRef}
        src={track.streamUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />

      <div className="player-left">
        <div className="player-cover" />
        <div>
          <strong>{track.title}</strong>
          <span>{track.artistRef?.name || track.artist}</span>
        </div>
      </div>

      <div className="player-center">
        <button className="play-btn" onClick={togglePlay}>
          {playing ? "❚❚" : "▶"}
        </button>

        <div className="progress" onClick={seek}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="volume">
          🔊
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={changeVolume}
          />
        </div>
      </div>
    </div>
  );
}
