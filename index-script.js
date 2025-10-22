document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username'); 
  const role = localStorage.getItem('role');
  const adminPanel = document.getElementById('admin-panel');

  if (role === 'admin') {
    adminPanel.style.display = 'block';
  }
  

 const signMessage = document.getElementById("sign-message");
  if (username) {
    signMessage.style.display = 'none';
  }

  // Logout button
  const logoutBtn = document.getElementById('logout');
  if (!username) {
    if (logoutBtn) logoutBtn.style.display = 'none';
    return;
  }

  if (logoutBtn) {
    logoutBtn.style.display = 'inline-block'; 
    logoutBtn.onclick = () => {
      localStorage.clear();
      location.href = 'index.html';
    };
  }

  // Greeting
  const greeting = document.getElementById('greeting');
  if (greeting) greeting.textContent = `Welcome, ${username}!`;

  // Login status
  const userInfo = document.getElementById('user-info');
  if (userInfo) userInfo.textContent = `Logged in as ${username}`;
});
