document.addEventListener('DOMContentLoaded', () => {
  // Cek login
  if (!localStorage.getItem('isLogin')) {
    window.location.href = 'index.html';
    return;
  }
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('loggedInUser').textContent = `${user.name} (${user.role})`;

  // Inisialisasi
  setupControls();
  setupModal();
  renderCalendar();
  renderScheduleList();

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
});

// ===== DATA =====
let currentDate = new Date();
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

// ===== RENDER =====
function renderCalendar() {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  document.getElementById('currentMonthYear').textContent =
    currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  const body = document.getElementById('calendarBody');
  body.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    body.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const day = document.createElement('div');
    day.textContent = d;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (schedules.some(s => s.date === dateStr)) {
      day.style.backgroundColor = 'rgba(74,111,165,0.1)';
    }

    body.appendChild(day);
  }
}

function renderScheduleList() {
  const tbody = document.getElementById('scheduleTableBody');
  tbody.innerHTML = '';

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const filter = document.getElementById('locationFilter').value;

  schedules
    .filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === month &&
        d.getFullYear() === year &&
        (filter === 'all' || s.location === filter);
    })
    .forEach(s => {
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

// ===== CONTROL =====
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

  document.getElementById('locationFilter').addEventListener('change', () => {
    renderScheduleList();
  });

  document.getElementById('addScheduleBtn').addEventListener('click', () => {
    openModal();
  });
}

// ===== MODAL =====
function setupModal() {
  const modal = document.getElementById('scheduleModal');
  const closeBtn = modal.querySelector('.close');

  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.getElementById('scheduleForm').addEventListener('submit', e => {
    e.preventDefault();
    saveSchedule();
  });

  document.getElementById('location').addEventListener('change', e => {
    document.getElementById('locationDetailGroup').style.display =
      e.target.value === 'Lapangan' ? 'block' : 'none';
  });

  document.getElementById('deleteBtn').addEventListener('click', () => {
    deleteSchedule(document.getElementById('scheduleId').value);
    closeModal();
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
    document.getElementById('scheduleId').value = data.id;
    document.getElementById('groomName').value = data.groomName;
    document.getElementById('brideName').value = data.brideName;
    document.getElementById('groomPhone').value = data.groomPhone;
    document.getElementById('bridePhone').value = data.bridePhone;
    document.getElementById('weddingDate').value = data.date;
    document.getElementById('weddingTime').value = data.time;
    document.getElementById('location').value = data.location;
    document.getElementById('documentStatus').value = data.documentStatus;
    document.getElementById('notes').value = data.notes;
    document.getElementById('locationDetail').value = data.locationDetail || '';
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

// ===== CRUD =====
function saveSchedule() {
  const id = document.getElementById('scheduleId').value || Date.now().toString();
  const schedule = {
    id,
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

  const index = schedules.findIndex(s => s.id === id);
  if (index > -1) {
    schedules[index] = schedule;
  } else {
    schedules.push(schedule);
  }

  localStorage.setItem('schedules', JSON.stringify(schedules));
  renderCalendar();
  renderScheduleList();
  closeModal();
}

function editSchedule(id) {
  const data = schedules.find(s => s.id === id);
  if (data) openModal(data);
}

function deleteSchedule(id) {
  schedules = schedules.filter(s => s.id !== id);
  localStorage.setItem('schedules', JSON.stringify(schedules));
  renderCalendar();
  renderScheduleList();
}
