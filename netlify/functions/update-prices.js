import { neon } from '@netlify/neon';

export async function handler() {
  const sql = neon();

  const stocks = await sql`SELECT ticker, price FROM stocks`;

  for (const stock of stocks) {
    const pctChange = (Math.random() * (3 - 1) + 1) / 100; 
    const direction = Math.random() < 0.5 ? -1 : 1; 
    const newPrice = Math.max(0, parseFloat(stock.price) * (1 + direction * pctChange));

    await sql`UPDATE stocks SET price = ${newPrice} WHERE ticker = ${stock.ticker}`;
  }

  return { statusCode: 200, body: 'Prices updated' };
}
