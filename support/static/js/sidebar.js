const sidebar   = document.getElementById('sidebar');
const toggle    = document.getElementById('sidebarToggle');
const STORE_KEY = 'cw_sidebar_expanded';

function applySidebar(expanded) {
  sidebar.classList.toggle('expanded', expanded);
  document.body.classList.toggle('sidebar-expanded', expanded);
  document.documentElement.classList.toggle('sidebar-expanded', expanded);
  toggle.textContent = expanded ? '\u00AB' : '\u00BB';
  try { localStorage.setItem(STORE_KEY, expanded ? '1' : '0'); } catch(e) {}
}

// Save sidebar state before navigating
document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', () => {
    try {
      localStorage.setItem(STORE_KEY, sidebar.classList.contains('expanded') ? '1' : '0');
    } catch(e) {
      console.error('Error saving sidebar state:', e);
    }
  });
});

// Restore saved state on desktop only
if (window.innerWidth > 640) {
  const shouldExpand = localStorage.getItem(STORE_KEY) === '1';
  applySidebar(shouldExpand);
}
sidebar.classList.add('ready'); 

toggle.addEventListener('click', () => {
  applySidebar(!sidebar.classList.contains('expanded'));
});

// Press [ to toggle
document.addEventListener('keydown', e => {
  if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const tag = document.activeElement.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      applySidebar(!sidebar.classList.contains('expanded'));
    }
  }
});

