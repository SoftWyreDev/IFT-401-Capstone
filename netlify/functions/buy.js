import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function checkTradingTime(schedule) {
  const now = new Date();

  // Manual closure
  if (schedule.manual_closed) return { allowed: false, message: 'Market Manually Closed' };

  // Weekday check
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = dayNames[now.getDay()];
  const allowedDays = schedule.weekdays.split(',').map(d => d.trim());
  if (!allowedDays.includes(today)) return { allowed: false, message: 'Market Closed on Weekends' };

  // Holiday check
  const todayDate = new Date(now);
  todayDate.setHours(0,0,0,0); 

  const isHoliday = schedule.holidays && schedule.holidays.some(d => {
    const holidayDate = new Date(d);
    holidayDate.setHours(0,0,0,0); 
    return holidayDate.getTime() === todayDate.getTime();
  });

  if (isHoliday) return { allowed: false, message: 'Market Closed on Holidays' };

  // Open/close times
  const [openH, openM] = schedule.open_time.split(':').map(Number);
  const [closeH, closeM] = schedule.close_time.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
  // Normal same-day market
  if (minutesNow < openMinutes || minutesNow >= closeMinutes)
    return { allowed: false, message: "Market Closed After Hours" };
} else {
  // Market wraps past midnight
  if (minutesNow < openMinutes && minutesNow >= closeMinutes)
    return { allowed: false, message: "Market Closed After Hours" };
}

  return { allowed: true };
}

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

    // --- Get trading rules from DB ---
    const tradingRules = await sql`SELECT * FROM market_schedule LIMIT 1`;
    console.log('Trading schedule from DB:', tradingRules[0]);
    if (tradingRules.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Trading rules not found' }) };
    }

    const stockData = await sql`SELECT price FROM stocks WHERE ticker = ${ticker}`;
    if (stockData.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Stock not found' }) };
    const price = Number(stockData[0].price);
    const totalCost = Math.round(price * 100) * qty / 100;
    const marketSchedule = tradingRules[0];

    const tradingStatus = checkTradingTime(marketSchedule);
    if (!tradingStatus.allowed) {
      // Queue the order
      await sql`
        INSERT INTO queued_orders (user_id, ticker, shares, type)
        VALUES (${userId}, ${ticker}, ${qty}, 'BUY')
      `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Bought ${qty} share(s) of ${ticker} for $${totalCost.toFixed(2)}<br><br>
        Market CLOSED. Buy Order Queued until Market Opens`,
        queued: true
      })
    };
  }

    // --- Get user balance ---
    const user = await sql`SELECT balance FROM users WHERE id = ${userId}`;
    if (user.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    const balance = Number(user[0].balance);

    if (stockData.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Stock not found' }) };

    if (balance < totalCost) return { statusCode: 400, body: JSON.stringify({ message: 'Insufficient Funds' }) };

    // --- Update or insert stock holdings ---
    const existing = await sql`SELECT quantity FROM user_stocks WHERE user_id = ${userId} AND ticker = ${ticker}`;
    if (existing.length > 0) {
      await sql`
        UPDATE user_stocks
        SET quantity = quantity + ${qty}
        WHERE user_id = ${userId} AND ticker = ${ticker}
      `;
    } else {
      await sql`
        INSERT INTO user_stocks (user_id, ticker, quantity)
        VALUES (${userId}, ${ticker}, ${qty})
      `;
    }

    // --- Deduct balance ---
    await sql`UPDATE users SET balance = balance - ${totalCost} WHERE id = ${userId}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Bought ${qty} share(s) of ${ticker} for $${totalCost.toFixed(2)}` })
    };

  } catch (err) {
    console.error('Buy stock error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}
