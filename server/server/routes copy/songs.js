import express from 'express';
import pool from '../db/pool.js';
import NodeCache from 'node-cache';

const songsRouter = express.Router();

function encodeCursor(rank, title) {
  return `${rank}|${title}`;
}

function decodeCursor(cursor) {
  const [rank, ...titleParts] = cursor.split('|');
  return { rank: Number(rank), title: titleParts.join('|') };
}


// pull all the songs with the elected language
songsRouter.get('/', async (req, res) => {
  const { language, cursor } = req.query;
  const pageSize = 100;
  try {
    let params = [];
    let where = '';
    // Ensure language is always set to 'english' if not provided
    const lang = language || 'english';
    params.push(lang);
    where = `WHERE language = $1`;

    // Use normalized title as cursor for correct alphabetical pagination
    if (cursor !== undefined) {
      params.push(cursor);
      where += ` AND LOWER(REGEXP_REPLACE(title, '^[^a-zA-Z]+', '')) > $${params.length}`;
    }
    const q = `
      SELECT id, title, language,
        LOWER(REGEXP_REPLACE(title, '^[^a-zA-Z]+', '')) AS normalized_title
      FROM songs
      ${where}
      ORDER BY normalized_title ASC
      LIMIT ${pageSize + 1}
    `;
    const result = await pool.query(q, params);

    let hasMore = false;
    let nextCursor = null;
    let songs = result.rows;
    if (songs.length > pageSize) {
      hasMore = true;
      songs = songs.slice(0, pageSize);
      nextCursor = songs[songs.length - 1].normalized_title;
    }

    // Remove normalized_title from response
    songs = songs.map(({ normalized_title, ...rest }) => rest);

    res.json({
      songs,
      nextCursor,
      hasMore
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /search?language=...&q=...
songsRouter.get('/search', async (req, res) => {
  const { language = 'english', q = '', cursor, pageSize = 50 } = req.query;

  try {
    let songs = [];
    let hasMore = false; 
    let nextCursor = null;
    if (q && /^\d+$/.test(q.trim()) && language) {
      // 1. Find the book(s) for the language
      const bookRes = await pool.query('SELECT id FROM books WHERE $1 = ANY(language)', [language]);
      if (!bookRes.rows.length) {
        return res.json({ songs: [], nextCursor: null, hasMore: false });
      }
      const bookIds = bookRes.rows.map(row => row.id);

      // 2. Find the songbase_id in book_song_map for these book(s) and number
      const mapRes = await pool.query(
        'SELECT songbase_id FROM book_song_map WHERE book_id = ANY($1) AND number_in_book = $2',
        [bookIds, Number(q)]
      );
      if (!mapRes.rows.length) {
        return res.json({ songs: [], nextCursor: null, hasMore: false });
      }
      const songIds = mapRes.rows.map(row => row.songbase_id);

      // 3. Get the song title from songs table, apply pagination
      const pageSize = Number(req.query.pageSize) || 50;
      const cursor = req.query.cursor;

      let queryText = `
        SELECT s.id, s.title, b.name AS book_name, m.number_in_book
        FROM songs s
        JOIN book_song_map m ON s.songbase_id = m.songbase_id
        JOIN books b ON b.id = m.book_id
        WHERE s.songbase_id = ANY($1)
      `;

      const queryParams = [songIds];

      // Apply cursor (if provided)
      if (cursor) {
        queryText += ` AND LOWER(title) > LOWER($2)`;
        queryParams.push(cursor);
      }

      queryText += `
        ORDER BY LOWER(title)
        LIMIT $${queryParams.length + 1}
      `;
      queryParams.push(pageSize + 1); // Fetch one extra for hasMore check

      const songRes = await pool.query(queryText, queryParams);
      songs = songRes.rows;

      // Handle pagination
      nextCursor = null;
      hasMore = false;
      if (songs.length > pageSize) {
        hasMore = true;
        songs = songs.slice(0, pageSize);
        nextCursor = songs[songs.length - 1].title;
      }
      console.log(songs);

      songs = songs.map(({ id, title, book_name, number_in_book }) => ({
        id,
        title,
        book: {
          name: book_name,
          number: number_in_book
        }
      }));
      
    } else {
      /////BEGINNING OF SECOND PART
      const queryParams = [];
      const conditions = [`language = $${queryParams.length + 1}`];
      queryParams.push(language);
      

      // Title or lyrics match
      conditions.push(`(
        regexp_replace(lower(title), '[^a-z0-9]+', '', 'g') LIKE '%' || regexp_replace(lower($${queryParams.length + 1}), '[^a-z0-9]+', '', 'g') || '%'
        OR
        regexp_replace(lower(lyrics), '[^a-z0-9]+', '', 'g') LIKE '%' || regexp_replace(lower($${queryParams.length + 1}), '[^a-z0-9]+', '', 'g') || '%'
      )`);
      queryParams.push(q);


      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Base query with rank computed in SQL
      let queryText = `
        WITH ranked_songs AS (
          SELECT
            id,
            title,
            CASE
              WHEN regexp_replace(lower(title), '[^a-z0-9]+', '', 'g') LIKE regexp_replace(lower($${queryParams.length + 1}), '[^a-z0-9]+', '', 'g') || '%' THEN 1
              WHEN regexp_replace(lower(title), '[^a-z0-9]+', '', 'g') LIKE '%' || regexp_replace(lower($${queryParams.length + 2}), '[^a-z0-9]+', '', 'g') || '%' THEN 2
              ELSE 3
            END AS rank

          FROM songs
          ${whereClause}
        )
        SELECT id, title, rank
        FROM ranked_songs
      `;

      queryParams.push(q, q); // rank computation

      // Apply cursor
      if (cursor) {
        const { rank: lastRank, title: lastTitle } = decodeCursor(cursor);
        queryText += `
          WHERE (rank > $${queryParams.length + 1})
            OR (rank = $${queryParams.length + 1} AND LOWER(title) > LOWER($${queryParams.length + 2}))
        `;
        queryParams.push(lastRank, lastTitle);
      }

      queryText += `
        ORDER BY rank, LOWER(REGEXP_REPLACE(title, '^[^a-zA-Z]+', ''))
        LIMIT $${queryParams.length + 1}
      `;
      queryParams.push(Number(pageSize) + 1); // Fetch extra to check if more pages exist

      const result = await pool.query(queryText, queryParams);
       songs = result.rows;

      // Determine nextCursor
      if (songs.length > pageSize) {
        hasMore = true;
        songs = songs.slice(0, pageSize);
        const last = songs[songs.length - 1];
        nextCursor = encodeCursor(last.rank, last.title);
      }

      // Remove rank from response
      songs = songs.map(({ rank, ...rest }) => rest);
    }

    
    res.json({ songs, nextCursor, hasMore });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});




// GET a single song by ID
songsRouter.get('/:id', async (req, res) => {
  const songId = Number(req.params.id);

  try {
    // Get simple song data from songs table ONLY
    const data = await pool.query('SELECT * FROM songs WHERE id = $1', [songId]);
    if (!data.rows.length) return res.status(404).json({ error: 'Song not found' });
    const songData = data.rows[0];

    // Get book information for the song
    const b = await pool.query(
      `SELECT b.name, b.slug, m.number_in_book
         FROM book_song_map m
         JOIN books b ON b.id = m.book_id
        WHERE m.songbase_id = $1
        ORDER BY b.slug`,
      [songData.songbase_id]
    );

    // Build the song object for response
    const song = {
      ...songData,
      book: b.rows.map(r => ({
        name: r.name,
        slug: r.slug,
        number: r.number_in_book,
        hymnal_url: r.slug === 'english_hymnal'
          ? `https://www.hymnal.net/en/hymn/h/${r.number_in_book}`
          : null
      }))
    };

    // Add translations info if language_links exists
    if (songData.language_links) {
      let links;
      // Parse the language_links field: if it's a string, parse it as JSON,
      // otherwise assume it's already an array, if all fails, default to an empty array
      try {
        links = typeof songData.language_links === 'string'
          ? JSON.parse(songData.language_links)
          : songData.language_links;
      } catch {
        links = [];
      }
      // If links is an array of songbase_ids (numbers)
      if (Array.isArray(links) && links.length > 0) {
        // Fetch all songs in one query
        const { rows } = await pool.query(
          `SELECT s.songbase_id, s.id, s.title, s.language, m.number_in_book
          FROM songs s
          JOIN book_song_map m ON s.songbase_id = m.songbase_id
          WHERE s.songbase_id = ANY($1)
          ORDER BY m.number_in_book::int ASC`,
          [links]
        );


        // Merge data
        song.translations = rows.map(row => ({
          language: row.language,
          title: row.title,
          url: `/songs/${row.id}`,
          songbase_id: row.songbase_id,
          number_in_book: row.number_in_book
        }));
      }
    } else {
      song.translations = [];
    }

    res.json(song);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


export default songsRouter;
