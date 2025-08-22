import express from 'express';
import pool from '../db/pool.js';
const booksRouter = express.Router();

booksRouter.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, songbase_book_id, name, slug FROM books ORDER BY id');
  res.json(rows);
});

booksRouter.get('/:slug/', async (req, res) => {
  const { slug } = req.params;  
  // Fetch the book details
  const b = await pool.query('SELECT id FROM books WHERE slug = $1', [slug]);
  if (!b.rows.length) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const bookId = b.rows[0].id;
  console.log(bookId);
  // list all the songs in the book and their number in the book
  const params = [bookId];
  let where = 'WHERE m.book_id = $1';

  const q = `
    SELECT s.id, s.title, m.number_in_book
      FROM book_song_map m
      JOIN songs s ON s.songbase_id = m.songbase_id
      ${where}
     ORDER BY m.number_in_book::int ASC
  `;
  const { rows } = await pool.query(q, params);
  console.log(rows);
  // No pagination/cursor logic needed
  res.json({ songs: rows });
});

export default booksRouter;
