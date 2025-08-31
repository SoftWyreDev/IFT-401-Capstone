import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'invalid json' };
  }

  const { emailOrUsername, password } = data;
  if (!emailOrUsername || !password) {
    return { statusCode: 400, body: 'missing fields' };
  }

  const sql = neon();

  const users = await sql`
    SELECT id, username, email, password_hash, role
    FROM users 
    WHERE email = ${emailOrUsername} OR username = ${emailOrUsername}
    LIMIT 1
  `;
  const user = users[0];
  if (!user) return { statusCode: 401, body: 'invalid credentials' };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { statusCode: 401, body: 'invalid credentials' };

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, 
      iat: Math.floor(Date.now() / 1000),
      app_metadata: {
        authorization: {
          roles: [user.role]
        }
      }
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      token,
      username: user.username,
      role: user.role
    })
  };
}
