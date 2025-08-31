import { neon } from '@netlify/neon';

export async function handler() {
  const sql = neon();

  const stocks = await sql`
    SELECT ticker, company, price, volume, price_open, price_high, price_low FROM stocks ORDER BY ticker ASC`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stocks)
  };
}
