document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const validUsers = [
      { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
      { username: 'KAKUA', password: 'KAKUA123', name: 'MUHAMAD ALI', role: 'KEPALA KUA' }
    ];

    const user = validUsers.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('isLogin', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = 'dashboard.html';
    } else {
      document.getElementById('loginError').textContent = 'Username atau password salah.';
    }
  });
});
