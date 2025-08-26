import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

function SongSearch({ language }) {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  // Fetch first page or search results
  useEffect(() => {
    setSongs([]);
    setNextCursor(null);
    setHasMore(false);

    const fetchSongs = async () => {
      setLoading(true);
      loadingRef.current = true;
      try {
        let url;
        if (query.trim() === '') {
          url = `${process.env.REACT_APP_API_URL}/songs?language=${encodeURIComponent(language)}`;
          const res = await fetch(url);
          const data = await res.json();
          setSongs(data.songs || []);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
        } else {
          url = `${process.env.REACT_APP_API_URL}/songs/search?language=${encodeURIComponent(language)}&q=${encodeURIComponent(query)}`;
          const res = await fetch(url);
          const data = await res.json();
          setSongs(data.songs || data || []);
        }
      } catch (err) {
        console.error('Failed to fetch songs:', err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    fetchSongs();
    // eslint-disable-next-line
  }, [query, language]);

  // Infinite scroll for paginated (non-search) results
  useEffect(() => {
    if (query.trim() !== '' || !hasMore) return;

    let debounceTimeout = null;
    const handleScroll = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (
          window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
          hasMore &&
          !loadingRef.current
        ) {
          fetchMoreSongs();
        }
      }, 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
    // eslint-disable-next-line
  }, [query, hasMore, nextCursor]);

  const fetchMoreSongs = async () => {
    if (loadingRef.current || !nextCursor) return;
    setLoadingMore(true);
    loadingRef.current = true;
    try {
      const url = `${process.env.REACT_APP_API_URL}/songs?language=${encodeURIComponent(language)}&cursor=${encodeURIComponent(nextCursor)}`;
      const res = await fetch(url);
      const data = await res.json();
      setSongs((prev) => [...prev, ...(data.songs || [])]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch more songs:', err);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  };
  console.log(songs);
  return (
    <div className="p-4 max-w-xl mx-auto">
      <input
        type="text"
        placeholder="Search for a hymn title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 text-lg shadow-sm"
      />

      {loading && <p className="mt-2 text-gray-500">Searching...</p>}
      {!loading && songs.length === 0 && <p>No songs found.</p>}
      {/* List of songs */}
      <ul className="mt-4 space-y-2">
        {songs.map((song) => (
          <li key={song.id} className="bg-white p-3 rounded-lg shadow">
            <Link to={`/songs/${song.id}`} className="block">
              <div className="font-bold">{song.title}</div>
              {/* <div className="text-sm text-gray-500">{song.hymn_number}</div> I need to decide whether or not to add it*/}
            </Link>
          </li>
        ))}
      </ul>
      {loadingMore && <p className="mt-2 text-gray-500">Loading more...</p>}
    </div>
  );
}

export default SongSearch;
