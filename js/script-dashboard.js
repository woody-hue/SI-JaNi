let currentDate = new Date();
let schedules = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('isLogin')) {
    window.location.href = 'index.html';
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('loggedInUser').textContent = `${user.name} (${user.role})`;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  setupControls();
  setupModal();
  loadSchedules();
});

async function loadSchedules() {
  try {
    const res = await fetch('/api/schedules');
    schedules = await res.json();
    renderCalendar();
    renderScheduleList();
  } catch (err) {
    console.error('Gagal load jadwal:', err);
  }
}

async function saveScheduleToAPI(data) {
  try {
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    loadSchedules();
  } catch (err) {
    console.error('Gagal simpan jadwal:', err);
  }
}

function setupControls() {
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    renderScheduleList();
  });
  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    renderScheduleList();
  });
  document.getElementById('locationFilter').addEventListener('change', renderScheduleList);
  document.getElementById('addScheduleBtn').addEventListener('click', () => openModal());
}

function renderCalendar() {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  document.getElementById('currentMonthYear').textContent = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const body = document.getElementById('calendarBody');
  body.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    body.appendChild(document.createElement('div'));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement('div');
    div.textContent = d;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (schedules.some(s => s.date === dateStr)) {
      div.style.background = 'rgba(74,111,165,0.2)';
    }
    body.appendChild(div);
  }
}

function renderScheduleList() {
  const tbody = document.getElementById('scheduleTableBody');
  tbody.innerHTML = '';
  const filter = document.getElementById('locationFilter').value;
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  schedules.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year &&
      (filter === 'all' || s.location === filter);
  }).forEach(s => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${s.date}</td>
      <td>${s.time}</td>
      <td>${s.groomName}</td>
      <td>${s.brideName}</td>
      <td>${s.groomPhone} / ${s.bridePhone}</td>
      <td>${s.location} ${s.locationDetail || ''}</td>
      <td>${s.documentStatus}</td>
      <td>${s.notes}</td>
      <td>
        <button onclick="editSchedule('${s.id}')">Edit</button>
        <button onclick="deleteSchedule('${s.id}')">Hapus</button>
      </td>`;
    tbody.appendChild(row);
  });
}

function setupModal() {
  const modal = document.getElementById('scheduleModal');
  modal.querySelector('.close').addEventListener('click', closeModal);
  window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('scheduleForm').addEventListener('submit', e => {
    e.preventDefault();
    saveSchedule();
  });
  document.getElementById('location').addEventListener('change', e => {
    document.getElementById('locationDetailGroup').style.display = e.target.value === 'Lapangan' ? 'block' : 'none';
  });
}

function openModal(data = null) {
  const form = document.getElementById('scheduleForm');
  form.reset();
  document.getElementById('deleteBtn').style.display = 'none';
  document.getElementById('locationDetailGroup').style.display = 'none';
  document.getElementById('scheduleId').value = '';

  if (data) {
    document.getElementById('modalTitle').textContent = 'Edit Jadwal Nikah';
    Object.keys(data).forEach(k => {
      if (document.getElementById(k)) document.getElementById(k).value = data[k];
    });
    if (data.location === 'Lapangan') {
      document.getElementById('locationDetailGroup').style.display = 'block';
    }
    document.getElementById('deleteBtn').style.display = 'inline-block';
  } else {
    document.getElementById('modalTitle').textContent = 'Tambah Jadwal Nikah';
  }

  document.getElementById('scheduleModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('scheduleModal').style.display = 'none';
}

function saveSchedule() {
  const data = {
    groomName: document.getElementById('groomName').value,
    brideName: document.getElementById('brideName').value,
    groomPhone: document.getElementById('groomPhone').value,
    bridePhone: document.getElementById('bridePhone').value,
    date: document.getElementById('weddingDate').value,
    time: document.getElementById('weddingTime').value,
    location: document.getElementById('location').value,
    locationDetail: document.getElementById('locationDetail').value,
    documentStatus: document.getElementById('documentStatus').value,
    notes: document.getElementById('notes').value
  };

  saveScheduleToAPI(data);
  closeModal();
}

function editSchedule(id) {
  const data = schedules.find(s => s.id === id);
  if (data) openModal(data);
}

async function updateScheduleToAPI(data) {
  await fetch('/api/schedules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  loadSchedules();
}

async function deleteSchedule(id) {
  await fetch('/api/schedules', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  loadSchedules();
}