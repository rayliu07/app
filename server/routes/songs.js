import express from 'express';
import pool from '../db/pool.js';

const songsRouter = express.Router();

// GET all songs
songsRouter.get('/', async (req, res) => {
  const { language } = req.query;
  try {
    const result = await pool.query('SELECT * FROM songs WHERE language = $1 ORDER BY id', [language]);
    res.json(result.rows);
    console.log(result.rows.length);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /search?language=...&q=...
songsRouter.get('/search', async (req, res) => {
  const { language, q } = req.query;
  try {
    let queryText = 'SELECT * FROM songs WHERE 1=1';
    const queryParams = [];
    if (language) {
      queryText += ' AND language = $1';
      queryParams.push(language);
    }
    if (q) {
      queryText += ` AND (title ILIKE $${queryParams.length + 1} OR lyrics ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${q}%`);
    }
    queryText += ' ORDER BY id';
    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single song by ID
songsRouter.get('/:id', async (req, res) => {
  const songId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM songs WHERE id = $1', [songId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching song by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default songsRouter;
