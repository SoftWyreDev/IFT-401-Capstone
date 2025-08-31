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

  const { company, ticker, volume, price, price_open, price_high, price_low } = data;

  if (!company || !ticker || !volume || !price) {
    return { statusCode: 400, body: 'Missing fields' };
  }

  const open = price_open ?? price;
  const high = price_high ?? price;
  const low  = price_low ?? price;

  const sql = neon();
  try {
    const rows = await sql`
      INSERT INTO stocks (company, ticker, volume, price, price_open, price_high, price_low)
      VALUES (${company}, ${ticker}, ${volume}, ${price}, ${open}, ${high}, ${low})
      RETURNING *;
    `;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows[0])
    };
  } catch (e) {
    if (String(e).includes('duplicate') || String(e).includes('unique')) {
      return { statusCode: 409, body: 'Ticker already exists' };
    }
    console.error(e);
    return { statusCode: 500, body: 'Database error' };
  }
}
