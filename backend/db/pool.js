// db/pool.js - PostgreSQL connection pool
// This file is imported by all routes that need DB access
const { Pool } = require('pg');
require('dotenv').config();

// Railway provides DATABASE_URL; fall back to individual vars for local dev
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Railway/Heroku hosted Postgres
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'leadagg',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Database connection failed:', err.message);
  } else {
    console.log('✅  Connected to PostgreSQL');
    release();
  }
});

module.exports = pool;
