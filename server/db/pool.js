import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  user: 'postgres',           // your DB username
  password: 'Rayliu07@',      // your DB password (can include @, !, etc.)
  host: '/cloudsql/songsearchapp-471216:us-central1:ss',      // your Cloud SQL IP
  port: 5432,                 // default PostgreSQL port
  database: 'ss', 
  ssl: false
});

export default pool;
