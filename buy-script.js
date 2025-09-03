document.addEventListener('DOMContentLoaded', async () => {
  const tickerSelect = document.getElementById('ticker');
  const buyForm = document.getElementById('buy-form');
  const buyMsg = document.getElementById('buy-msg');
  const token = localStorage.getItem('token');

  try {
    const res = await fetch('/.netlify/functions/get-stocks');
    const stocks = await res.json();

    stocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.ticker; 
        option.textContent = `${stock.ticker} - $${Number(stock.price).toFixed(2)}`;
        tickerSelect.appendChild(option);
        });
  } catch (err) {
    console.error('Error loading stocks:', err);
    buyMsg.textContent = 'Error loading stock list';
  }

  buyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ticker = tickerSelect.value;
    const shares = parseInt(document.getElementById('shares').value);

    const res = await fetch('/.netlify/functions/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ticker, shares })
    });

    const data = await res.json(); 

    if (res.ok) {
    buyMsg.innerHTML = data.message;
    buyMsg.style.color = 'green';
    buyMsg.style.fontFamily = "Times New Roman"
    setTimeout(() => {
    buyMsg.textContent = '';
    }, 10000);
    await window.loadQueuedOrders();

    } else {
    buyMsg.textContent = data.message || data.error || 'Error occurred';
    buyMsg.style.color = 'red';
    buyMsg.style.fontFamily = "Times New Roman"

    }

    document.getElementById('shares').value = '';

    await loadUserStocks();  
    await loadBalance();
    await loadStocks();
  });
});
