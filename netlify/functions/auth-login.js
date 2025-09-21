const { initSchema } = require('./db');
const { findUserByEmail, signJwt } = require('./_auth');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    await initSchema();
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !password) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Missing credentials' }) };
    }
    const user = await findUserByEmail(email);
    if (!user) return { statusCode: 401, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Invalid login' }) };
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return { statusCode: 401, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Invalid login' }) };
    const token = signJwt({ sub: user.id, email: user.email, role: user.role });
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, user: { id: user.id, email: user.email, role: user.role } }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Server error', message: e.message }) };
  }
};
