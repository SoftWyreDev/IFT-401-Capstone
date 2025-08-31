document.addEventListener('DOMContentLoaded', () => {

function formatMarketCap(value) {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value}`;
}

function formatVolume(value) {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  } else if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toString();
}

  const tableBody = document.querySelector('#stocks-table tbody');

  async function loadStocks() {
    try {
      const res = await fetch('/.netlify/functions/get-stocks');
      const stocks = await res.json();

      tableBody.innerHTML = ''; 

      stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${stock.ticker}</td>
          <td>${stock.company}</td>
          <td><b>$${parseFloat(stock.price).toFixed(2)}</b></td>
          <td><b>${formatVolume(stock.volume)}</b></td>
          <td><b>${formatMarketCap(stock.volume * stock.price)}</b></td>
          <td><b>$${parseFloat(stock.price_open).toFixed(2)}</b></td>
          <td><b>$${parseFloat(stock.price_high).toFixed(2)}</b></td>
          <td><b>$${parseFloat(stock.price_low).toFixed(2)}</b></td>
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

//   // Polling every 5 seconds
//   setInterval(async () => {
//     await fetch('/.netlify/functions/update-prices'); 
//     loadStocks(); 
//   }, 30000);
});
