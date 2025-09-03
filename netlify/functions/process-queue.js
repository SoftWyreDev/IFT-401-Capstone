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

// Process queued orders 
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

  const sql = neon();

  try {
    // Get market schedule 
    const tradingRules = await sql`SELECT * FROM market_schedule LIMIT 1`;
    if (!tradingRules.length) return { statusCode: 500, body: JSON.stringify({ error: 'Trading rules not found' }) };
    const marketSchedule = tradingRules[0];
    const tradingStatus = checkTradingTime(marketSchedule);

    // Fetch queued orders 
    const queuedOrders = await sql`
      SELECT * FROM queued_orders
      WHERE executed = false
      ORDER BY created_at ASC
    `;
    if (!queuedOrders.length) return { statusCode: 200, body: JSON.stringify({ message: 'No queued orders to execute' }) };

    // Process orders
    for (const order of queuedOrders) {
      const orderUserId = order.user_id;

      // Fetch stock price
      const stockData = await sql`SELECT price FROM stocks WHERE ticker = ${order.ticker}`;
      if (!stockData.length) continue;
      const price = Number(stockData[0].price);
      const totalValue = Math.round(price * 100) * order.shares / 100;

      // Fetch user balance
      const user = await sql`SELECT balance FROM users WHERE id = ${orderUserId}`;
      if (!user.length) continue;
      const balance = Number(user[0].balance);

      //  Only execute if market is open 
      if (tradingStatus.allowed) {
        if (order.type === 'BUY') {
          if (balance < totalValue) continue;

          const existing = await sql`SELECT quantity FROM user_stocks WHERE user_id = ${orderUserId} AND ticker = ${order.ticker}`;
          if (existing.length > 0) {
            await sql`
              UPDATE user_stocks
              SET quantity = quantity + ${order.shares}
              WHERE user_id = ${orderUserId} AND ticker = ${order.ticker}
            `;
          } else {
            await sql`
              INSERT INTO user_stocks (user_id, ticker, quantity)
              VALUES (${orderUserId}, ${order.ticker}, ${order.shares})
            `;
          }

          await sql`UPDATE users SET balance = balance - ${totalValue} WHERE id = ${orderUserId}`;
          await sql`
            INSERT INTO user_history (user_id, action, ticker, quantity, amount, created_at)
            VALUES (${orderUserId}, 'BUY', ${order.ticker}, ${order.shares}, ${totalValue}, NOW())
            `;
        }

        if (order.type === 'SELL') {
          const holding = await sql`SELECT quantity FROM user_stocks WHERE user_id = ${orderUserId} AND ticker = ${order.ticker}`;
          if (!holding.length || holding[0].quantity < order.shares) continue;

          await sql`UPDATE users SET balance = balance + ${totalValue} 
            WHERE id = ${orderUserId}`;
          await sql`UPDATE user_stocks SET quantity = quantity - ${order.shares} 
            WHERE user_id = ${orderUserId} AND ticker = ${order.ticker}`;
          await sql`
            INSERT INTO user_history (user_id, action, ticker, quantity, amount, created_at)
            VALUES (${orderUserId}, 'SELL', ${order.ticker}, ${order.shares}, ${totalValue}, NOW())
            `;      
          await sql`
            DELETE FROM user_stocks
            WHERE user_id = ${orderUserId} AND ticker = ${order.ticker} AND quantity <= 0`;
        }

        // Mark as executed 
        await sql`UPDATE queued_orders SET executed = true, status = 'COMPLETE' WHERE id = ${order.id}`;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Queued orders processed successfully' }) };
  } catch (err) {
    console.error('Process queue error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}
