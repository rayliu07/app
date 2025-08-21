// server/routes/books.js
import express from 'express';
import pool from '../db/pool.js';
const booksRouter = express.Router();

booksRouter.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, external_id, name, slug FROM books ORDER BY slug');
  res.json(rows);
});

booksRouter.get('/:slug/songs', async (req, res) => {
  const { slug } = req.params;
  const { limit = 50, cursor } = req.query;
  const L = Math.min(Number(limit) || 50, 100);

  const b = await pool.query('SELECT id FROM books WHERE slug = $1', [slug]);
  if (!b.rows.length) return res.status(404).json({ error: 'Book not found' });
  const bookId = b.rows[0].id;

  const params = [bookId];
  let where = 'WHERE m.book_id = $1';
  if (cursor) {
    params.push(Number(cursor));
    where += ` AND s.id > $${params.length}`;
  }

  const q = `
    SELECT s.id, s.title, m.book_song_number
      FROM book_song_map m
      JOIN songs s ON s.id = m.song_id
      ${where}
     ORDER BY s.id ASC
     LIMIT ${L + 1}
  `;
  const { rows } = await pool.query(q, params);
  const hasMore = rows.length > L;
  const items = hasMore ? rows.slice(0, L) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  res.json({ items, nextCursor, hasMore });
});

export default booksRouter;
