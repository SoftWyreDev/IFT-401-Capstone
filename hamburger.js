document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('sidebar');
  const body = document.body;

  if (navToggle && nav) {
    // Toggle open/close
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation(); 
      navToggle.classList.toggle('active');
      nav.classList.toggle('open');
      body.classList.toggle('nav-open');
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        nav.classList.remove('open');
        navToggle.classList.remove('active');
        body.classList.remove('nav-open');
      }
    });


    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.classList.remove('active');
        body.classList.remove('nav-open');
      });
    });
  }
});
