const form = document.getElementById('signup');
form.onsubmit = async (e) => {
e.preventDefault();
const body = JSON.stringify(Object.fromEntries(new FormData(form).entries()));

const res = await fetch('/.netlify/functions/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body
});

document.getElementById('msg').textContent =
    res.ok ? 'Account created!' : await res.text();
};