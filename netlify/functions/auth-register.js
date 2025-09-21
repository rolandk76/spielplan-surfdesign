const { initSchema } = require('./db');
const { findUserByEmail, createUser, signJwt } = require('./_auth');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    await initSchema();
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !password || String(password).length < 6) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Invalid email or password' }) };
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return { statusCode: 409, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'User already exists' }) };
    }
    const user = await createUser(email, password, 'user');
    const token = signJwt({ sub: user.id, email: user.email, role: user.role });
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, user: { id: user.id, email: user.email, role: user.role } }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Server error', message: e.message }) };
  }
};
