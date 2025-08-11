import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fetchLanguages() {
  const res = await fetch('https://songbase.life/api/v2/languages');
  const data = await res.json();
  return data.languages;
}

async function fetchSongsByLanguage(lang) {
  const res = await fetch(`https://songbase.life/api/v2/app_data?language=${lang}`);
  const json = await res.json();
  return json.songs || [];
}

async function insertSong(song, language) {
  const { id, title, author, lyrics, key } = song;
  try {
    await pool.query(`
      INSERT INTO songs (song_id, title, author, lyrics, key, language)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (song_id) DO NOTHING
    `, [id, title, author, lyrics, null, language]);
  } catch (err) {
    console.error(`Error inserting song ${id}:`, err.message);
  }
}

async function run() {
  const languages = await fetchLanguages();
  for (const lang of languages) {
    console.log(`Fetching songs in: ${lang}`);
    const songs = await fetchSongsByLanguage(lang);
    for (const song of songs) {
      await insertSong(song, lang);
    }
  }
  console.log('✅ Import complete.');
  await pool.end();
}

run();
