import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

function BookDetail() {
  const { slug } = useParams();
  const [songs, setSongs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const fetchSongs = async (cursor = null) => {
    if (loadingRef.current) return;
    setLoading(true);
    loadingRef.current = true;
    try {
      const url = new URL(`${process.env.REACT_APP_API_URL}/books/${slug}`);
      if (cursor !== null) url.searchParams.append('cursor', cursor);
      const res = await fetch(url);
      const data = await res.json();
      if (cursor) {
        setSongs((prev) => [...prev, ...data.songs]);
      } else {
        setSongs(data.songs);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching book:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    setSongs([]);
    setNextCursor(null);
    setHasMore(false);
    fetchSongs();
    // eslint-disable-next-line
  }, [slug]);

  useEffect(() => {
    if (!hasMore) return;

    let debounceTimeout = null;
    const handleScroll = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (
          window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
          hasMore &&
          !loadingRef.current
        ) {
          fetchSongs(nextCursor);
        }
      }, 10); // reduced from 100ms to 10ms
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
    // eslint-disable-next-line
  }, [hasMore, nextCursor]);

  if (!songs || (songs.length === 0 && loading)) return <p>Loading book...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      {songs.map((song) => (
        <div key={song.id}>
          <Link to={`/songs/${song.id}`}>
            <h2>{song.title} ({song.number_in_book})</h2>
          </Link>
        </div>
      ))}
      {loading && <p>Loading more...</p>}
    </div>
  );
}

export default BookDetail;
