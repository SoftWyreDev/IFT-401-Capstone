import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

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
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) {
    return { statusCode: 400, body: 'Invalid amount' };
  }

const sql = neon();

const result = await sql`
  UPDATE users
  SET balance = balance - ${amount}
  WHERE id = ${userId} AND balance >= ${amount}
  RETURNING balance
`;

if (result.length === 0) {
  return {
    statusCode: 400,
    body: 'Insufficient funds'
  };
}

return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ok: true, newBalance: result[0].balance })
};

}
