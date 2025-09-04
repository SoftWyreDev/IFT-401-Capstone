import { neon } from '@netlify/neon';

export async function handler() {
  const sql = neon();

  const stocks = await sql`
    SELECT ticker, price, price_open, price_high, price_low, price_update
    FROM stocks
  `;

  const now = new Date();

  // Today’s 9:30 AM
  const marketOpenToday = new Date(now);
  marketOpenToday.setHours(9, 30, 0, 0);

  for (const stock of stocks) {
    const lastUpdate = new Date(stock.price_update);

    // Has this stock been updated *before* today’s market open?
    const isNewMarketDay =
      lastUpdate < marketOpenToday && now >= marketOpenToday;

    // Generate price movement
    const pctChange = (Math.random() * 0.3 + 0.05) / 100;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const newPrice = Math.max(
      0,
      parseFloat(stock.price) * (1 + direction * pctChange)
    );

    let openPrice = stock.price_open;
    let highPrice = stock.price_high;
    let lowPrice = stock.price_low;

    if (isNewMarketDay) {
      // Reset once at market open
      openPrice = newPrice;
      highPrice = newPrice;
      lowPrice = newPrice;
    } else {
      // Keep the same open price all day
      openPrice = stock.price_open ?? newPrice;
      highPrice = Math.max(stock.price_high ?? newPrice, newPrice);
      lowPrice = Math.min(stock.price_low ?? newPrice, newPrice);
    }

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
