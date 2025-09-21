const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL;
    if (!connectionString) throw new Error('Missing NETLIFY_DATABASE_URL/UNPOOLED');
    pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function initSchema() {
  const client = await getPool().connect();
  try {
    console.log('[DB] init schema');
    await client.query(`
      create table if not exists tournaments (
        id text primary key,
        name text not null,
        settings jsonb not null,
        matches jsonb not null,
        last_modified timestamptz not null default now(),
        owner_id text
      );
    `);
    await client.query(`alter table tournaments add column if not exists owner_id text`);
    await client.query(`alter table tournaments add column if not exists versions jsonb default '[]'::jsonb`);
    await client.query(`alter table tournaments add column if not exists audit_log jsonb default '[]'::jsonb`);
    await client.query(`create index if not exists idx_tournaments_owner on tournaments(owner_id)`);
    // users table for custom auth
    await client.query(`
      create table if not exists users (
        id uuid primary key default gen_random_uuid(),
        email text unique not null,
        password_hash text not null,
        role text not null default 'user',
        created_at timestamptz not null default now()
      );
    `);
    await client.query(`create index if not exists idx_users_email on users(lower(email))`);
  } finally {
    client.release();
  }
}

module.exports = { getPool, initSchema };
