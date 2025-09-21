import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// MySQL pool
let pool;
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'forge',
      password: process.env.DB_PASSWORD || 'secret',
      database: process.env.DB_DATABASE || 'spielplan',
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }
  return pool;
}

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = data;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health/HEAD for connectivity check
app.head('/.netlify/functions/tournaments', (_req, res) => res.sendStatus(200));

// Auth: register
app.post('/.netlify/functions/auth-register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const pool = await getPool();
    const pwHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [id, email, pwHash, 'user']
    );
    return res.json({ ok: true });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email exists' });
    console.error('auth-register error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

// Auth: login
app.post('/.netlify/functions/auth-login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1', [email]);
    const user = Array.isArray(rows) && rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    console.error('auth-login error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

// Auth: me
app.get('/.netlify/functions/auth-me', requireAuth, async (req, res) => {
  return res.json({ user: { id: req.user.sub, email: req.user.email, role: req.user.role || 'user' } });
});

// Tournaments API
app.get('/.netlify/functions/tournaments', async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT id, name, settings, matches, last_modified FROM tournaments ORDER BY last_modified DESC');
    const list = (rows || []).map(r => ({
      id: r.id,
      lastModified: new Date(r.last_modified).toISOString(),
      settings: typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings,
      matches: typeof r.matches === 'string' ? JSON.parse(r.matches) : r.matches,
    }));
    return res.json(list);
  } catch (e) {
    console.error('GET tournaments error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

app.post('/.netlify/functions/tournaments', async (req, res) => {
  try {
    const t = req.body || {};
    if (!t.id || !t.settings || !t.matches) return res.status(400).json({ error: 'invalid payload' });
    const pool = await getPool();
    const name = t.settings.name || 'Turnier';
    const settingsJson = JSON.stringify(t.settings);
    const matchesJson = JSON.stringify(t.matches);
    await pool.execute(
      'INSERT INTO tournaments (id, name, settings, matches, last_modified) VALUES (?, ?, ?, ?, NOW(6))\n       ON DUPLICATE KEY UPDATE name = VALUES(name), settings = VALUES(settings), matches = VALUES(matches), last_modified = NOW(6)',
      [t.id, name, settingsJson, matchesJson]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('POST tournaments error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

app.delete('/.netlify/functions/tournaments', async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const pool = await getPool();
    await pool.execute('DELETE FROM tournaments WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('DELETE tournaments error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
