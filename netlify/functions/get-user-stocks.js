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

  const stocks = await sql`
    SELECT u.ticker,
           u.quantity,
           u.avg_price,
           s.price AS current_price
    FROM user_stocks u
    JOIN stocks s USING (ticker)
    WHERE u.user_id = ${userId}  
    ORDER BY u.ticker
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stocks)
  };
}
