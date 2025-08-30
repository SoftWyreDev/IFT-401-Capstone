const loginForm = document.getElementById('login');
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const body = JSON.stringify(Object.fromEntries(new FormData(loginForm).entries()));

  const res = await fetch('/.netlify/functions/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body
  });

  if (res.ok) {
    location.href = 'index.html';
  } else {
    document.getElementById('msg').textContent = await res.text();
  }
};
