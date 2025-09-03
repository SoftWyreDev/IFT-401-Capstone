document.addEventListener('DOMContentLoaded', async () => {
  const sellForm = document.getElementById('sell-form');
  const sellTickerSelect = document.getElementById('sell-ticker');
  const sellMsg = document.getElementById('sell-msg');
  const token = localStorage.getItem('token');

  // Load user-owned stocks for selling
  async function loadUserStocks() {
    try {
      const res = await fetch('/.netlify/functions/get-user-stocks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userStocks = await res.json();

      sellTickerSelect.innerHTML = '<option value="">-- Select a stock --</option>';
      
      userStocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.ticker;
        option.textContent = `${stock.ticker} - ${stock.quantity} shares`;
        sellTickerSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading user stocks:', err);
      sellMsg.textContent = 'Error loading your stocks';
      sellMsg.style.color = 'red';
    }
  }

  await loadUserStocks();

  // Handle sell form submission
  sellForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ticker = sellTickerSelect.value;
    const shares = parseInt(document.getElementById('sell-shares').value);

    if (!ticker || isNaN(shares) || shares <= 0) {
      sellMsg.textContent = 'Please select a stock and enter a valid share amount';
      sellMsg.style.color = 'red';
      return;
    }

    try {
      const res = await fetch('/.netlify/functions/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticker, shares })
      });

      const data = await res.json();

      if (res.ok) {
        sellMsg.innerHTML = data.message;
        sellMsg.style.color = 'green';
        sellMsg.style.fontFamily = "Times New Roman"
        document.getElementById('sell-shares').value = '';
        await window.loadQueuedOrders();
      } else {
        sellMsg.textContent = data.message || data.error || 'Error occurred';
        sellMsg.style.color = 'red';
        sellMsg.style.fontFamily = "Times New Roman"
      }

      await loadBalance();
      await loadUserStocks();

    } catch (err) {
      console.error('Error selling stock:', err);
      sellMsg.textContent = 'Error processing sell order';
      sellMsg.style.color = 'red';
      sellMsg.style.fontFamily = "Times New Roman"
    }
  });
});
