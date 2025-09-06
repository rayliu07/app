import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  user: process.env.DB_USER,           // your DB username
  password: process.env.DB_PASSWORD,      // your DB password (can include @, !, etc.)
  host: process.env.DB_HOST,      // your Cloud SQL IP
  port: process.env.DB_PORT,                 // default PostgreSQL port
  database: process.env.DB_NAME, 
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
