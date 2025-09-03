async function flushQueuedOrders() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/.netlify/functions/process-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Queued orders processed:', data);

    if (typeof loadQueuedOrders === 'function') {
      await loadQueuedOrders();
    }

    if (typeof loadBalance === 'function') {
      await loadBalance();
    }

    if (typeof loadStocks === 'function') {
      await loadStocks(); 
    }

  } catch (err) {
    console.error(err);
  }
}

// Run immediately
flushQueuedOrders();
// Then every 30 seconds
// setInterval(flushQueuedOrders, 30000);