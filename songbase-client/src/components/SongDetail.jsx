// src/pages/SongDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
//import SongDisplay from './SongDisplay - SongBase';
import SongDisplay from '../components/SongDisplaySongbase';



function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/songs/${id}`);
        console.log(`${process.env.REACT_APP_API_URL}/songs/${id}`);
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

      {/* Here’s where you render the lyrics using SongDisplay */}
      <SongDisplay lyrics={song.lyrics} showChords={true}/>

    </div>
  );
}

export default SongDetail;
