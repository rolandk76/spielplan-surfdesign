const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('./db');

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.AUTH_JWT_EXPIRES_IN || '7d';

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

async function findUserByEmail(email) {
  const pool = getPool();
  const res = await pool.query('select id, email, password_hash, role from users where lower(email) = lower($1) limit 1', [email]);
  return res.rows[0] || null;
}

async function createUser(email, password, role = 'user') {
  const pool = getPool();
  const password_hash = await bcrypt.hash(password, 10);
  const res = await pool.query(
    'insert into users (email, password_hash, role) values (lower($1), $2, $3) returning id, email, role',
    [email, password_hash, role]
  );
  return res.rows[0];
}

function getTokenFromAuthHeader(event) {
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

module.exports = { signJwt, verifyJwt, findUserByEmail, createUser, getTokenFromAuthHeader };
