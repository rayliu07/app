import express from 'express';
import pool from '../db/pool.js';

const languagesRouter = express.Router();

// GET /api/languages - returns all available languages
languagesRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT language FROM songs ORDER BY language');
    const languages = result.rows.map(row => row.language);
    res.json({ languages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

languagesRouter.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // simple query
    res.send({ dbTime: result.rows[0] });
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).send({ error: err.message });
  }
});

export default languagesRouter;