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

  const result = await sql`
    SELECT balance
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const balance = result[0]?.balance || 0; 

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ balance })
  };
}
