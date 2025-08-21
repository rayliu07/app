import pool from '../server/db/pool.js';
import fs from 'fs';
import path from 'path';

// Resolve absolute path to the JSON file
const filePath = path.resolve('./songbase_books.json');

// Load SongBase JSON
const songbaseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

async function importBooks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const book of songbaseData.books) {
      // Insert or update the book
      const insertBookRes = await client.query(
        `INSERT INTO books (songbase_book_id, name, slug, languages)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug)
         DO UPDATE SET
           songbase_book_id = EXCLUDED.songbase_book_id,
           name = EXCLUDED.name,
           languages = EXCLUDED.languages
         RETURNING id`,
        [book.id, book.name, book.slug, book.languages]
      );

      const newBookId = insertBookRes.rows[0].id;

      // Insert into book_song_map for each song in this book
      for (const [songIdStr, hymnNumberStr] of Object.entries(book.songs)) {
        const songbaseId = parseInt(songIdStr, 10);
        const hymnNumber = hymnNumberStr ? parseInt(hymnNumberStr, 10) : null;

        if (!Number.isInteger(songbaseId)) {
          console.warn(`Skipping invalid song ID: ${songIdStr}`);
          continue;
        }

        await client.query(
          `INSERT INTO book_song_map (book_id, songbase_id, number_in_book)
           VALUES ($1, $2, $3)
           ON CONFLICT (book_id, songbase_id) DO NOTHING`,
          [newBookId, songbaseId, hymnNumber]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Books and mappings imported successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
  }
}

importBooks();
