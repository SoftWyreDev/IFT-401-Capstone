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
    const history = await sql`
      SELECT action, ticker, quantity, amount, created_at
      FROM user_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(history) 
    };
  } catch (err) {
    console.error('Get user history error:', err);
    return { statusCode: 500, body: 'Server error' };
  }
}
