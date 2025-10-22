document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const adminPanel = document.getElementById('admin-panel');
  const role = localStorage.getItem('role');

  if (role === 'admin') {
    adminPanel.style.display = 'block';
  }
  
  if (!username) {
    window.location = '/index.html';
    alert('You must be signed in to view this page.');
    console.log(localStorage.getItem('role'));

    return;
  }

  // Greeting
  const greeting = document.getElementById('greeting');
  if (greeting) {
    greeting.textContent = `Welcome, ${username}!`;
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
      location.href = '/index.html';
    };
  }
    if (!username) {
    if (logoutBtn) logoutBtn.style.display = 'none';
    return;
  }
});
