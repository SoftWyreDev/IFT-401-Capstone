import { neon } from '@netlify/neon';

export async function handler() {
  const sql = neon();
  const rows = await sql`SELECT open_time, close_time, weekdays, holidays, manual_closed
    FROM market_schedule
    LIMIT 1;`
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows[0])
  };
}
