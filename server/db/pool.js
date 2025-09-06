import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  user: 'postgres',           // your DB username
  password: 'Rayliu07@',      // your DB password (can include @, !, etc.)
  host: '35.193.50.152',      // your Cloud SQL IP
  port: 5432,                 // default PostgreSQL port
  database: 'ss', 
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
