import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function SongSearch({ language }) {//language is passed as a prop from the parent component
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Call my API when query changes
  useEffect(() => {
    
    // Otherwise, fetch songs from the API
    const fetchSongs = async () => {
      setLoading(true);
      try {
        let url;
        // If query is empty, reset songs and return early
        // This prevents unnecessary API calls, especially on initial render and when there is nothing in the search bar
        if (query.trim() === '') {
          url = `${process.env.REACT_APP_API_URL}/songs?language=${encodeURIComponent(language)}`;
        } else {
          url = `${process.env.REACT_APP_API_URL}/songs/search?language=${encodeURIComponent(language)}&q=${encodeURIComponent(query)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        // Sort songs alphabetically by title, ignoring single or double quotes
        const sortedSongs = (data || []).sort((a, b) => {
          const cleanTitleA = a.title.replace(/^['"]+/, '');
          const cleanTitleB = b.title.replace(/^['"]+/, '');
          return cleanTitleA.localeCompare(cleanTitleB);
        });
        setSongs(sortedSongs);
        console.log(url);
      } catch (err) {
        console.error('Failed to fetch songs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [query, language]);

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
    </div>
  );
}

export default SongSearch;
