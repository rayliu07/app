import express from 'express';
import pool from '../../db/pool.js';
const booksRouter = express.Router();

booksRouter.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, songbase_book_id, name, slug FROM books ORDER BY id');
  res.json(rows);
});

booksRouter.get('/:slug/', async (req, res) => {
  const { slug } = req.params;
  const { cursor } = req.query;
  // Fetch the book details
  const b = await pool.query('SELECT id FROM books WHERE slug = $1', [slug]);
  if (!b.rows.length) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const bookId = b.rows[0].id;
  // list all the songs in the book and their number in the book
  // Pagination logic
  const pageSize = 30;
  let params = [bookId];
  let where = 'WHERE m.book_id = $1';
  if (cursor !== undefined) {
    params.push(cursor);
    where += ' AND m.number_in_book::int > $2';
  }

  const q = `
    SELECT s.id, s.title, m.number_in_book
      FROM book_song_map m
      JOIN songs s ON s.songbase_id = m.songbase_id
      ${where}
     ORDER BY m.number_in_book::int ASC
     LIMIT ${pageSize + 1}
  `;
  const { rows } = await pool.query(q, params);

  // Prepare pagination response
  let hasMore = false;
  let nextCursor = null;
  let songs = rows;
  if (rows.length > pageSize) {
    hasMore = true;
    songs = rows.slice(0, pageSize);
    nextCursor = songs[songs.length - 1].number_in_book;
  }

  res.json({
    songs,
    nextCursor,
    hasMore
  });
});

export default booksRouter;
