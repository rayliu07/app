import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
//import SongDisplay from './SongDisplay - SongBase';
import ParsedSongDisplay from '../SongDetail/ParsedSongDisplay';
import ExtraInformation from '../SongDetail/ExtraInformation';




function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/songs/${id}`);
        const data = await res.json();
        setSong(data);
      } catch (err) {
        console.error('Error fetching song:', err);
      }
    };

    fetchSong();
  }, [id]);

  if (!song) return <p>Loading song...</p>;

  return (
     <div style={{ padding: '2rem' }}>
      <h1>{song.title}</h1>

      {/* render the lyrics using ParsedSongDisplay */}
      <ParsedSongDisplay rawLyrics={song.lyrics} />
      {/* render extra information about the song */}
      <ExtraInformation song={song} />

    </div>
  );
}

export default SongDetail;