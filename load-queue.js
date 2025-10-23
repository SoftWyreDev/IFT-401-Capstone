document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const tableBody = document.querySelector('#stocks-table tbody');

  // Load queued orders
  window.loadQueuedOrders = async function() {
    try {
      const res = await fetch('/.netlify/functions/get-queue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const queuedOrders = await res.json();
      console.log(queuedOrders);


      tableBody.innerHTML = '';

      if (queuedOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;"><b>No Queued Orders</b></td></tr>`;
        return;
        }

      queuedOrders.forEach(order => {
        const date = new Date(order.created_at);
        const localTime = new Date(date.getTime() - 7 * 60 * 60 * 1000)  
        .toLocaleString('en-US', { hour12: true }); 
        const row = document.createElement('tr');
        row.innerHTML = `
          <td data-label="Type"><b>${order.type}</b></td>
          <td data-label="Ticker">${order.ticker}</td>
          <td data-label="Shares">${order.shares}</td>
          <td data-label="Created At">${localTime} (PDT)</td>
          <td data-label="Status"><b>${order.status}</b></td>
          <td data-label="Cancel" class="${order.status === 'COMPLETE' ? 'hide-mobile' : ''}">
           ${order.status === 'COMPLETE'
          ? ''
           : `<button class="cancel-btn" onclick="cancelQueuedOrder(${order.id})">❌</button>`}
          </td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Error loading queued orders:', err);
      tableBody.innerHTML = '<tr><td colspan="5" style="color:red;">Error loading queued orders</td></tr>';
    }
  }

window.cancelQueuedOrder = async function(orderId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/.netlify/functions/cancel-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Queued order canceled');
      loadQueuedOrders();
    } else {
      alert(data.error || 'Failed to cancel order');
    }
  } catch (err) {
    console.error('Cancel order error:', err);
    alert('Error canceling order');
  }
};

  // Initial load
  loadQueuedOrders();
});
