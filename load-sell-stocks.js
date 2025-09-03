async function loadUserStocks() {
  const token = localStorage.getItem('token');
  const res = await fetch('/.netlify/functions/get-user-stocks', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const userStocks = await res.json();

  const dropdown = document.getElementById('sell-ticker');
  dropdown.innerHTML = '<option value="">-- Select a stock --</option>';

  userStocks.forEach(stock => {
    const option = document.createElement('option');
    option.value = stock.ticker;
    option.textContent = `${stock.ticker} - ${stock.quantity} shares`;
    dropdown.appendChild(option);
  });
}
