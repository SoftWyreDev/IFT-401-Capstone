document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  if (!username) {
    window.location = '/login.html';
    return;
  }

  // Greeting
  const greeting = document.getElementById('greeting');
  if (greeting) {
    greeting.textContent = `Hello, ${username}!`;
  }

  // login status
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.textContent = `Logged in as ${username}`;
  }

  // Logout button
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.clear();
      location.href = '/login.html';
    };
  }
});
