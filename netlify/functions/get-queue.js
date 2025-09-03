import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function handler(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: 'Missing token' };

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return { statusCode: 401, body: 'Invalid token' };
  }

  const userId = payload.sub;
  const sql = neon();

  try {
    const queuedOrders = await sql`
      SELECT id,
             type,
             ticker,
             shares,
             status,
             created_at
      FROM queued_orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queuedOrders)
    };
  } catch (err) {
    console.error('Error fetching queued orders:', err);
    return { statusCode: 500, body: 'Server error' };
  }
}
