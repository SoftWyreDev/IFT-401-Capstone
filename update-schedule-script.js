const toggle = document.getElementById('manual-closed-toggle');
const statusSpan = document.getElementById('market-status');
const openInput = document.getElementById('open-time');
const closeInput = document.getElementById('close-time');

function updateMarketStatus(isClosed) {
  statusSpan.textContent = isClosed ? 'Market is Closed' : 'Market is Open';
  statusSpan.style.color = isClosed ? 'red' : 'green';
}

async function loadMarketHours() {
  const res = await fetch('/.netlify/functions/get-schedule');
  const data = await res.json();
  openInput.value = data.open_time;
  closeInput.value = data.close_time;
  toggle.checked = data.manual_closed;
  updateMarketStatus(toggle.checked)
}

loadMarketHours();

toggle.addEventListener('change', async () => {
  updateMarketStatus(toggle.checked);
  const token = localStorage.getItem('token'); 
  await fetch('/.netlify/functions/update-schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      manual_closed: toggle.checked,
      open_time: openInput.value,
      close_time: closeInput.value
    })
  });
  statusSpan.textContent = toggle.checked ? 'Market is Closed' : 'Market is Open';
});
