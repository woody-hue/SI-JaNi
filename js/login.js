document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isLogin')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const users = [
      { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
      { username: 'KAKUA', password: 'KAKUA123', name: 'MUHAMAD ALI', role: 'KEPALA KUA' }
    ];

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('isLogin', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = 'dashboard.html';
    } else {
      document.getElementById('loginError').textContent = 'Username atau password salah.';
    }
  });
});