document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#stocks-table tbody');

  async function loadStocks() {
    try {
      const res = await fetch('/.netlify/functions/get-stocks');
      const stocks = await res.json();

      tableBody.innerHTML = ''; 

      stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${stock.ticker} - ${stock.company}</td>
          <td><b>${parseFloat(stock.price).toFixed(2)}</b></td>
          <td><b>${parseFloat(stock.price_open).toFixed(2)}</b></td>
          <td><b>${parseFloat(stock.price_high).toFixed(2)}</b></td>
          <td><b>${parseFloat(stock.price_low).toFixed(2)}</b></td>
        `;
        tableBody.appendChild(row);
      });

      return stocks;
    } catch (err) {
      console.error('Error fetching stocks:', err);
      return [];
    }
  }

  // Initial load immediately
  loadStocks();

  // Polling every 5 seconds
  setInterval(async () => {
    await fetch('/.netlify/functions/update-prices'); 
    loadStocks(); 
  }, 30000);
});
