const { initSchema } = require('./db');
const { verifyJwt, getTokenFromAuthHeader } = require('./_auth');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    await initSchema();
    const token = getTokenFromAuthHeader(event);
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    const payload = verifyJwt(token);
    if (!payload) return { statusCode: 401, body: 'Unauthorized' };
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: { id: payload.sub, email: payload.email, role: payload.role } }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Server error', message: e.message }) };
  }
};
