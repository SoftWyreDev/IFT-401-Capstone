import { neon } from '@netlify/neon';

export async function handler() {
  const sql = neon();

  const stocks = await sql`
    SELECT ticker, price, price_open, price_high, price_low, price_update
    FROM stocks
  `;

  const now = new Date();
  const marketOpenToday = new Date();
  marketOpenToday.setHours(9, 30, 0, 0); // 9:30 AM today

  for (const stock of stocks) {
    // Determine if we need to reset open/high/low for a new market day
    const lastUpdate = new Date(stock.price_update);
    const isNewMarketDay = lastUpdate < marketOpenToday;

    // Generate new price
    const pctChange = (Math.random() * 0.3 + 0.05) / 100;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const newPrice = Math.max(0, parseFloat(stock.price) * (1 + direction * pctChange));

    // Reset open/high/low if it's a new market day
    const openPrice = isNewMarketDay ? newPrice : stock.price_open || newPrice;
    const highPrice = isNewMarketDay ? newPrice : Math.max(stock.price_high || newPrice, newPrice);
    const lowPrice = isNewMarketDay ? newPrice : Math.min(stock.price_low || newPrice, newPrice);

    // Update DB
    await sql`
      UPDATE stocks
      SET price = ${newPrice},
          price_open = ${openPrice},
          price_high = ${highPrice},
          price_low = ${lowPrice},
          price_update = ${now}
      WHERE ticker = ${stock.ticker}
    `;
  }

  return { statusCode: 200, body: 'Prices updated with daily open reset' };
}
