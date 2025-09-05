import express from 'express';
import dotenv from 'dotenv';
import songsRouter from './routes/songs.js';
import languagesRouter from './routes/languages.js'; 
import booksRouter from './routes/books.js';
import cors from 'cors'; 




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/songs', songsRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/books', booksRouter);

app.get('/', (req, res) => res.send('🎶 Songbase API running!'));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

