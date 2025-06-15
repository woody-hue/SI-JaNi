document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
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
      } catch (err) {
        showNotification('Error', { body: 'Terjadi kesalahan koneksi', type: 'error' });
      }
    });
  }

  if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }

  if (document.getElementById('loggedInUser')) {
    if (!localStorage.getItem('isLogin')) {
      window.location.href = 'index.html';
    } else {
      const user = JSON.parse(localStorage.getItem('user'));
      document.getElementById('loggedInUser').textContent = `${user.name} (${user.role})`;
    }
  }
});

    
    // Enhanced Service Worker Registration with Update Detection
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New update available
                                showUpdateNotification();
                            }
                        }
                    });
                });
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });

        // Listen for controller change (update applied)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }
    
    // Initialize appropriate page
    if (document.getElementById('loginForm')) {
        setupLoginPage();
    } else if (document.getElementById('scheduleTable')) {
        setupDashboardPage();
    }

    // Request notification permission
    requestNotificationPermission();
});

// Enhanced notification function with PWA support
function showNotification(title, options = {}) {
    // Try PWA notification first
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    } 
    // Fallback to in-app notification
    else {
        const notification = document.createElement('div');
        notification.classList.add('notification', options.type || 'info');
        
        // Default icon based on type
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
        
        // Animation
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, options.duration || 5000);
    }
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Show update notification
function showUpdateNotification() {
    if (confirm('Versi baru tersedia! Muat ulang sekarang untuk mendapatkan fitur terbaru?')) {
        // Tell service worker to skip waiting
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SKIP_WAITING'
            });
        } else {
            window.location.reload();
        }
    }
}

// USER MANAGEMENT (unchanged)
const validUsers = [
    { 
        username: 'admin', 
        password: 'admin123', 
        name: 'Administrator',
        role: 'admin'
    },
    { 
        username: 'KAKUA', 
        password: 'KAKUA123', 
        name: 'MUHAMAD ALI',
        role: 'KEPALA KUA'
    }
];

// ... (rest of your existing code remains the same)

// MODIFIED saveSchedule function to use new notification system
function saveSchedule(e) {
    e.preventDefault();
    
    if (userRole !== 'admin') {
        showNotification('Akses Ditolak', {
            body: 'Hanya admin yang bisa menyimpan data',
            type: 'error'
        });
        return;
    }
    
    // ... (existing validation logic)
    
    // Show enhanced notification
    showNotification('Jadwal Tersimpan', {
        body: `Jadwal nikah ${groomName} & ${brideName} berhasil disimpan`,
        type: 'success'
    });
    
    // Show PWA notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('SI-JaNi: Jadwal Baru', {
            body: `Jadwal nikah ${groomName} & ${brideName} pada ${date} ${time}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png'
        });
    }
}

// Add this CSS for notifications
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

.notification.success {
    background: #28a745;
}

.notification.error {
    background: #dc3545;
}

.notification-icon {
    font-size: 20px;
}

.notification-content {
    flex: 1;
}

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
}
`;
document.head.appendChild(style);
