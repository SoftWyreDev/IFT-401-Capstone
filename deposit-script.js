document.addEventListener('DOMContentLoaded', () => {
  const depositForm = document.getElementById('deposit-form');
  const depositMsg = document.getElementById('deposit-msg');

  depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/.netlify/functions/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (!res.ok) {
        depositMsg.textContent = await res.text();
        return;
      }

      depositMsg.textContent = `$${amount.toFixed(2)} Deposited!`;
      depositMsg.style.color = "green"
      depositMsg.style.fontWeight = "bold"
      document.getElementById('deposit-amount').value = '';

      // Reload balance
      await loadBalance();
    } catch (err) {
      console.error(err);
      depositMsg.textContent = 'Error making deposit';
    }
  });
});
