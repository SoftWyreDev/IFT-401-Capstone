async function loadUserStocks() {
  const token = localStorage.getItem('token');
  const res = await fetch('/.netlify/functions/get-user-stocks', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const userStocks = await res.json();
  console.log('User stocks:', userStocks);

  const dropdown = document.getElementById('sell-ticker');
  dropdown.innerHTML = '<option value="">-- Select a stock --</option>';

  userStocks.forEach(stock => {
    const option = document.createElement('option');
    option.value = stock.ticker;
    const price = parseFloat(stock.current_price).toFixed(2);
    option.textContent = `${stock.ticker} - $${price} - ${stock.quantity} shares`;
    dropdown.appendChild(option);
  });
}
