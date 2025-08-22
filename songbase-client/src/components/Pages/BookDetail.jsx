import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

function BookDetail() {
  const { slug } = useParams();
  const [songs, setSongs] = useState(null);
  
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/books/${slug}`);
        const data = await res.json();
        setSongs(data.songs);
      } catch (err) {
        console.error('Error fetching book:', err);
      }
    };

    fetchBook();
  }, [slug]);
  


  if (!songs) return <p>Loading book...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      {songs.map((song) => (
        <div key={song.id}>
          <Link to={`/songs/${song.id}`}>
            <h2>{song.title} ({song.number_in_book})</h2>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default BookDetail;
