document.addEventListener('DOMContentLoaded', () => {
  const withdrawForm = document.getElementById('withdraw-form');
  const withdrawMsg = document.getElementById('withdraw-msg');

  withdrawForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/.netlify/functions/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (!res.ok) {
        withdrawMsg.textContent = await res.text();
        withdrawMsg.style.color = 'red';
        withdrawMsg.style.fontWeight="bold"
        setTimeout(() => {
          withdrawMsg.textContent = '';
          }, 5000);
        return;
      }

      withdrawMsg.textContent = `$${amount.toFixed(2)} Withdrawn!`;
      withdrawMsg.style.color = 'green';
      withdrawMsg.style.fontWeight = 'bold';
      setTimeout(() => {
          withdrawMsg.textContent = '';
          }, 5000)
      document.getElementById('withdraw-amount').value = '';

      await loadBalance();
    } catch (err) {
      console.error(err);
      withdrawMsg.textContent = 'Error making withdrawal';
      withdrawMsg.style.color = 'red';
    }
  });
});
