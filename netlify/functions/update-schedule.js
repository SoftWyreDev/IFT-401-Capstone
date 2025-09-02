import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { statusCode: 403, body: 'Forbidden: Admins only' };
    }
  } catch {
    return { statusCode: 401, body: 'Invalid token' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { open_time, close_time, manual_closed } = data;
  if (!open_time || !close_time) {
    return { statusCode: 400, body: 'Missing fields' };
  }

  console.log('Incoming data:', data);
  
  const sql = neon();
  try {
    await sql`
    UPDATE market_schedule
    SET open_time = ${open_time}, close_time = ${close_time}, manual_closed = ${manual_closed}
    WHERE id = 1
    `;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Market Hours Updated!' })
    };

  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Database error' };
  }
}
