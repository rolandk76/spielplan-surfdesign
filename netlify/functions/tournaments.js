const { getPool, initSchema } = require('./db');
const { getTokenFromAuthHeader, verifyJwt } = require('./_auth');

exports.handler = async (event) => {
  try {
    await initSchema();
    const pool = getPool();
    const token = getTokenFromAuthHeader(event);
    const payload = token ? verifyJwt(token) : null;
    const userId = payload && payload.sub;
    const isAdmin = payload && payload.role === 'admin';

    if (event.httpMethod === 'GET') {
      if (!userId) {
        // Return empty array for non-authenticated users instead of 401
        return {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify([]),
        };
      }
      const res = isAdmin
        ? await pool.query('select id, name, settings, matches, last_modified, owner_id, versions, audit_log from tournaments order by last_modified desc')
        : await pool.query('select id, name, settings, matches, last_modified, owner_id, versions, audit_log from tournaments where owner_id = $1 order by last_modified desc', [userId]);
      // map DB shape to frontend SavedTournament
      const items = res.rows.map(r => ({
        id: r.id,
        settings: r.settings,
        matches: r.matches,
        lastModified: r.last_modified,
        versions: r.versions || [],
        auditLog: r.audit_log || [],
      }));
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(items),
      };
    }

    if (event.httpMethod === 'POST') {
      if (!userId) return { statusCode: 401, body: 'Unauthorized' };
      const body = JSON.parse(event.body || '{}');
      const { id, settings, matches, lastModified, versions, auditLog } = body;
      console.log('[POST] upsert tournament', { id, hasSettings: !!settings, hasMatches: !!matches, lastModified });
      if (!id || !settings || !matches) {
        return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Missing fields', received: body }) };
      }
      const name = settings.name || 'Unbenanntes Turnier';
      const lm = lastModified || new Date().toISOString();
      try {
        await pool.query(
          `insert into tournaments (id, name, settings, matches, last_modified, owner_id, versions, audit_log)
           values ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7::jsonb,$8::jsonb)
           on conflict (id) do update set name = excluded.name, settings = excluded.settings, matches = excluded.matches, last_modified = excluded.last_modified, versions = excluded.versions, audit_log = excluded.audit_log
           where tournaments.owner_id = $6`,
          [id, name, JSON.stringify(settings), JSON.stringify(matches), lm, userId, JSON.stringify(versions || []), JSON.stringify(auditLog || [])]
        );
      } catch (e) {
        console.error('[DB] upsert failed', e);
        return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'DB upsert failed', message: e.message }) };
      }
      return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      if (!userId) return { statusCode: 401, body: 'Unauthorized' };
      const { id } = JSON.parse(event.body || '{}');
      console.log('[DELETE] tournament', { id });
      if (!id) return { statusCode: 400, body: 'Missing id' };
      if (isAdmin) {
        await pool.query('delete from tournaments where id = $1', [id]);
      } else {
        await pool.query('delete from tournaments where id = $1 and owner_id = $2', [id, userId]);
      }
      return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Server error', message: err.message }) };
  }
};
