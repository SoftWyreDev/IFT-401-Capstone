import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

export async function handler(event) {
    if (event.httpMethod !== 'POST')
        return { statusCode: 405, body: 'Method Not Allowed' };

    let data;
    try { data = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, body: 'invalid json' }; }

    const { username, email, password } = data;
    if (!username || !email || !password)
        return { statusCode: 400, body: 'missing fields' };

    try {
        const sql = neon();                   // uses NETLIFY_DATABASE_URL automatically
        const hash = await bcrypt.hash(password, 12);

        const rows = await sql/* sql */`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${hash})
      RETURNING id, username, email, created_at
    `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rows[0])
        };
    } catch (e) {
        const msg = String(e);
        if (msg.includes('duplicate') || msg.includes('unique'))
            return { statusCode: 409, body: 'Username or Email already exists' };
        console.error(e);
        return { statusCode: 500, body: 'error' };
    }
}
