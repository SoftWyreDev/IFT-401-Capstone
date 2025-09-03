async function loadUserHistory() {
  const token = localStorage.getItem('token');
  const res = await fetch('/.netlify/functions/get-user-history', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const history = await res.json();
  
  const tableBody = document.querySelector('#stocks-table tbody');
  tableBody.innerHTML = '';

  if (history.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No history found</td></tr>';
    return;
  }

  history.forEach(item => {
    const date = new Date(item.created_at);
    const amount = Number(item.amount);
    const localTime = new Date(date.getTime() - 7 * 60 * 60 * 1000) 
      .toLocaleString('en-US', { hour12: true });
    const row = document.createElement('tr');
    row.innerHTML = `
      <td ><b>${item.action}</b></td>
      <td>${item.ticker || '—'}</td>
      <td>${item.quantity || '—'}</td>
      <td>$${amount.toFixed(2)}</td>
      <td><b>${localTime} (PDT)</b></td>
    `;
    tableBody.appendChild(row);
  });
}

loadUserHistory();
