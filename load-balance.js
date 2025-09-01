async function loadBalance() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/.netlify/functions/get-balance', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    document.getElementById('balance').textContent =
      `Balance: $${parseFloat(data.balance).toFixed(2)}`;
  } catch (err) {
    console.error('Error fetching balance:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadBalance);
