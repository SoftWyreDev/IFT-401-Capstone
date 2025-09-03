import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Trading time checker 
export function checkTradingTime(schedule) {
  const now = new Date();

  if (schedule.manual_closed) return { allowed: false, message: 'Market Manually Closed' };

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = dayNames[now.getDay()];
  const allowedDays = schedule.weekdays.split(',').map(d => d.trim());
  if (!allowedDays.includes(today)) return { allowed: false, message: 'Market Closed on Weekends' };

  const todayDate = new Date(now);
  todayDate.setHours(0,0,0,0);
  const isHoliday = schedule.holidays?.some(d => {
    const holidayDate = new Date(d);
    holidayDate.setHours(0,0,0,0);
    return holidayDate.getTime() === todayDate.getTime();
  });
  if (isHoliday) return { allowed: false, message: 'Market Closed on Holidays' };

  const [openH, openM] = schedule.open_time.split(':').map(Number);
  const [closeH, closeM] = schedule.close_time.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
    if (minutesNow < openMinutes || minutesNow >= closeMinutes) return { allowed: false, message: 'Market Closed After Hours' };
  } else {
    if (minutesNow < openMinutes && minutesNow >= closeMinutes) return { allowed: false, message: 'Market Closed After Hours' };
  }

  return { allowed: true };
}

// Handler 
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: JSON.stringify({ error: 'Missing token' }) };

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  const userId = payload.sub;
  const sql = neon();

  try {
    const { ticker, shares } = JSON.parse(event.body);
    const qty = parseInt(shares, 10);
    if (isNaN(qty) || qty <= 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid shares value' }) };
    }

    // Get market schedule 
    const tradingRules = await sql`SELECT * FROM market_schedule LIMIT 1`;
    if (!tradingRules.length) return { statusCode: 500, body: JSON.stringify({ error: 'Trading rules not found' }) };
    const marketSchedule = tradingRules[0];

    // Get stock price 
    const stockData = await sql`SELECT price FROM stocks WHERE ticker = ${ticker}`;
    if (!stockData.length) return { statusCode: 404, body: JSON.stringify({ error: 'Stock not found' }) };
    const price = Number(stockData[0].price);
    const totalGain = Math.round(price * 100) * qty / 100;

    // Get user shares
    const userStock = await sql`
      SELECT quantity
      FROM user_stocks
      WHERE user_id = ${userId} AND ticker = ${ticker}
    `;
    const ownedShares = userStock[0]?.quantity || 0;
    if (qty > ownedShares) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Not enough shares to sell. You have ${ownedShares}` })
      };
    }

    // Check trading time 
    const tradingStatus = checkTradingTime(marketSchedule);

    if (tradingStatus.allowed) {
      // Execute sell immediately 
      await sql`UPDATE user_stocks SET quantity = quantity - ${qty} 
        WHERE user_id = ${userId} AND ticker = ${ticker}`;
      await sql`UPDATE users SET balance = balance + ${totalGain} 
        WHERE id = ${userId}`;
      // Update User History
      await sql`
        INSERT INTO user_history (user_id, action, ticker, quantity, amount, created_at)
        VALUES (${userId}, 'SELL', ${ticker}, ${qty}, ${totalGain}, NOW())
        `;
      // Delete if Zero
      await sql`
        DELETE FROM user_stocks
        WHERE user_id = ${userId} AND ticker = ${ticker} AND quantity <= 0
        `;

      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Sold ${qty} share(s) of ${ticker} for $${totalGain.toFixed(2)}` })
      };
    } else {
      // Queue the sell order 
      await sql`
        INSERT INTO queued_orders (user_id, ticker, shares, type)
        VALUES (${userId}, ${ticker}, ${qty}, 'SELL')
      `;

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Market CLOSED<br><br>
          Queued ${qty} share(s) of ${ticker} for $${totalGain.toFixed(2)}`,
          queued: true
        })
      };
    }

  } catch (err) {
    console.error('Sell stock error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}
