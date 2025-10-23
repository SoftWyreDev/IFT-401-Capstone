document.addEventListener('DOMContentLoaded', () => {
  const navToggleWrapper = document.querySelector('.nav-toggle-wrapper');
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('sidebar');
  const body = document.body;

  if (navToggleWrapper && nav) {
    // Toggle open/close when clicking the wrapper
    navToggleWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      navToggle.classList.toggle('active');
      nav.classList.toggle('open');
      body.classList.toggle('nav-open');
    });

    // Close when clicking outside the nav
    document.addEventListener('click', (e) => {
      if (
        !nav.contains(e.target) &&
        !navToggleWrapper.contains(e.target)
      ) {
        nav.classList.remove('open');
        navToggle.classList.remove('active');
        body.classList.remove('nav-open');
      }
    });

    // Close when a nav link is clicked
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.classList.remove('active');
        body.classList.remove('nav-open');
      });
    });
  }
});