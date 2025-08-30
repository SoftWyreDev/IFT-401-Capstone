const form = document.getElementById('login');

form.onsubmit = async (e) => {
  e.preventDefault();
  const body = JSON.stringify(Object.fromEntries(new FormData(form).entries()));

  const res = await fetch('/.netlify/functions/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    location.href = 'index.html';
  } else {
    document.getElementById('msg').textContent = await res.text();
  }
};
