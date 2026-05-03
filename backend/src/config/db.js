const { Pool } = require('pg');

// SSL config:
// - Default: verify the server cert against the system CA bundle. Works for
//   managed providers (Neon, Supabase, RDS) that serve publicly-trusted certs.
// - DB_SSL_INSECURE=true: skip verification. Required for self-signed local
//   setups; logs a warning so this isn't accidentally left on in production.
// - sslmode=disable in DATABASE_URL: fully disable SSL (plain TCP).
function buildSslConfig() {
  if (/sslmode=disable/.test(process.env.DATABASE_URL || '')) return false;
  if (process.env.DB_SSL_INSECURE === 'true') {
    console.warn('[db] WARNING: TLS verification disabled (DB_SSL_INSECURE=true)');
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: buildSslConfig(),
});

module.exports = pool;
