// Signup form handler
const signupForm = document.getElementById('signup');
signupForm.onsubmit = async (e) => {
  e.preventDefault();
  const body = JSON.stringify(Object.fromEntries(new FormData(signupForm).entries()));

  const res = await fetch('/.netlify/functions/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  const msg = document.getElementById('msg');
  if (res.ok) {
    msg.textContent = 'Account created! Redirecting to login...';
    msg.style.color = 'green';
    msg.style.fontWeight = 'bold';

    setTimeout(() => {
      window.location.href = '/login.html';
    }, 3000);
  } else {
    msg.textContent = await res.text();
    msg.style.color = 'red';
    msg.style.fontWeight = 'bold';
  }
};

