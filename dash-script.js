<script src="https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js"></script>
document.addEventListener('DOMContentLoaded', () => {
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, val] = cookie.trim().split('=');
    acc[name] = val;
    return acc;
}, {});

const token = cookies.session;
if (!token) return (window.location = '/login.html');

try {
    const { username } = jwt_decode(token);
    document.getElementById('greeting').textContent = `Hello, ${username}!`;
} catch {
    window.location = '/login.html';
}
});