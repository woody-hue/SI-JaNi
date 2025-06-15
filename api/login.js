export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  const validUsers = [
    { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
    { username: 'KAKUA', password: 'KAKUA123', name: 'MUHAMAD ALI', role: 'KEPALA KUA' }
  ];

  const user = validUsers.find(u => u.username === username && u.password === password);

  if (user) {
    return res.status(200).json({
      message: 'Login sukses',
      token: btoa(`${user.username}:${user.role}`),
      user
    });
  } else {
    return res.status(401).json({ message: 'Login gagal: username / password salah' });
  }
}
