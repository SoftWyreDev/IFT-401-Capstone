const toggle = document.getElementById('manual-closed-toggle');
const statusSpan = document.getElementById('market-status');
const openInput = document.getElementById('open-time');
const closeInput = document.getElementById('close-time');
const scheduleMsg = document.getElementById('schedule-msg');
const saveButton = document.getElementById('save-schedule');

function updateMarketStatus(isClosed) {
  statusSpan.textContent = isClosed ? 'Market is Closed' : 'Market is Open';
  statusSpan.style.color = isClosed ? 'red' : 'green';
}

// Load current market hours and toggle state
async function loadMarketHours() {
  const res = await fetch('/.netlify/functions/get-schedule');
  const data = await res.json();
  openInput.value = data.open_time;
  closeInput.value = data.close_time;
  toggle.checked = data.manual_closed;
  updateMarketStatus(toggle.checked);
}

// Update manual_closed only
async function updateManualClosed() {
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
  updateMarketStatus(toggle.checked); 
}

// Save market hours and show message
async function saveMarketHours() {
  const token = localStorage.getItem('token');
  const res = await fetch('/.netlify/functions/update-schedule', {
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
  const data = await res.json();

  scheduleMsg.textContent = data.message || 'Market Hours Updated!';
  scheduleMsg.style.color = 'green';
  scheduleMsg.style.fontWeight = 'bold';
  scheduleMsg.style.fontFamily="Times New Roman"

  setTimeout(() => (scheduleMsg.textContent = ''), 5000);
}

loadMarketHours();

// Event listeners
toggle.addEventListener('change', updateManualClosed);
saveButton.addEventListener('click', (e) => {
  e.preventDefault();
  saveMarketHours(); 
});
