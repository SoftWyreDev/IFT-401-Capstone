import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: JSON.stringify({ error: 'Missing token' }) };

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  const userId = payload.sub;
  const { orderId } = JSON.parse(event.body);

  const sql = neon();

  try {
    await sql`
      DELETE FROM queued_orders
      WHERE id = ${orderId} AND user_id = ${userId}
    `;

    return { statusCode: 200, body: JSON.stringify({ message: 'Queued order canceled' }) };
  } catch (err) {
    console.error('Cancel queued order error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}
