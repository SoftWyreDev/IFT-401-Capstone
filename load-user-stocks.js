async function loadStocks() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/.netlify/functions/get-user-stocks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stocks = await res.json();

    const tableBody = document.querySelector('#stocks-table tbody');
    tableBody.innerHTML = '';

    if (stocks.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;"><b>No Owned Stocks</b></td></tr>`;
        return;
        }
    

    stocks.forEach(stock => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><b>${stock.ticker}</b></td>
        <td><b>${stock.quantity}</b></td>
        <td><b>$${parseFloat(stock.current_price).toFixed(2)}</b></td>
        <td><b>$${parseFloat(stock.current_price * stock.quantity).toFixed(2)}</b></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error fetching stocks:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadStocks);
