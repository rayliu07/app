import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  user: 'ss_j5hw_user',           // your DB username
  password: 'Ou5Qa22hyQQdVPdhlupAVqsvYyDCLe8A',      // your DB password (can include @, !, etc.)
  host: 'postgresql://ss_j5hw_user:Ou5Qa22hyQQdVPdhlupAVqsvYyDCLe8A@dpg-d2t5e3ruibrs73efkla0-a.oregon-postgres.render.com/ss_j5hw',      // your Cloud SQL IP
  port: 5432,                 // default PostgreSQL port
  database: 'ss', 
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
