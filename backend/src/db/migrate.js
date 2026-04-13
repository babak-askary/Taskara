require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get list of already executed migrations
    const { rows: executed } = await client.query('SELECT name FROM _migrations ORDER BY name');
    const executedNames = new Set(executed.map(r => r.name));

    // Get all migration files sorted by name
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    let applied = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  skip: ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  done: ${file}`);
        applied++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  FAIL: ${file} — ${err.message}`);
        throw err;
      }
    }

    console.log(`\nMigrations complete. ${applied} new, ${files.length - applied} skipped.`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
