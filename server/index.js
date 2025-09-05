import express from 'express';
import dotenv from 'dotenv';
import songsRouter from './routes/songs.js';
import languagesRouter from './routes/languages.js'; 
import booksRouter from './routes/books.js';
import cors from 'cors'; 
import pool from '../db/pool.js';





dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use('/api/songs', songsRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/books', booksRouter);

app.get('/', (req, res) => res.send('🎶 Songbase API running!'));

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // simple query
    res.send({ dbTime: result.rows[0] });
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).send({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

