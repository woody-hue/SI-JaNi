document.addEventListener('DOMContentLoaded', () => {
  setupLoginHandler();
  setupLogoutHandler();
  setupDashboardInfo();
  registerServiceWorker();
  requestNotificationPermission();
});

// ========== LOGIN HANDLER ==========
function setupLoginHandler() {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('isLogin', 'true');
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = 'dashboard.html';
        } else {
          showNotification('Login Gagal', { body: data.message, type: 'error' });
        }
      } catch {
        showNotification('Error', { body: 'Terjadi kesalahan koneksi', type: 'error' });
      }
    });
  }
}

// ========== LOGOUT HANDLER ==========
function setupLogoutHandler() {
  const btn = document.getElementById('logoutBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
}

// ========== DASHBOARD USER INFO ==========
function setupDashboardInfo() {
  const info = document.getElementById('loggedInUser');
  if (info) {
    if (!localStorage.getItem('isLogin')) {
      window.location.href = 'index.html';
    } else {
      const user = JSON.parse(localStorage.getItem('user'));
      info.textContent = `${user.name} (${user.role})`;
    }
  }
}

// ========== SERVICE WORKER ==========
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      console.log('SW registered:', reg.scope);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
    }).catch(err => {
      console.error('SW registration failed:', err);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

// ========== NOTIFICATIONS ==========
function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  } else {
    createInAppNotification(title, options);
  }
}

function createInAppNotification(title, options) {
  const notification = document.createElement('div');
  notification.className = `notification ${options.type || 'info'}`;
  const icon = options.type === 'error' ? '❌' :
               options.type === 'success' ? '✅' : 'ℹ️';
  notification.innerHTML = `
    <span class="notification-icon">${icon}</span>
    <div class="notification-content">
      <strong>${title}</strong>
      ${options.body ? `<p>${options.body}</p>` : ''}
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, options.duration || 5000);
}

function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }
}

function showUpdateNotification() {
  if (confirm('Versi baru tersedia! Muat ulang sekarang?')) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }
}

// ========== STYLE UNTUK IN-APP NOTIFICATION ==========
const style = document.createElement('style');
style.textContent = `
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px;
  background: #4a6fa5;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1000;
}
.notification.show {
  transform: translateY(0);
  opacity: 1;
}
.notification.success { background: #28a745; }
.notification.error { background: #dc3545; }
.notification-icon { font-size: 20px; }
.notification-content { flex: 1; }
.notification-content p {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.9;
}
@media (max-width: 480px) {
  .notification {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}`;
document.head.appendChild(style);
