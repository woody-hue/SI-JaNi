document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('isLogin')) {
    window.location.href = 'index.html';
  } else {
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('loggedInUser').textContent = `${user.name} (${user.role})`;
  }

  setupCalendar();
  setupControls();
  setupModal();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
});

// ========== DATA & STATE ==========
let currentDate = new Date();
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

// ========== RENDER ==========
function setupCalendar() {
  renderCalendar(currentDate);
}

function renderCalendar(date) {
  const calendarBody = document.getElementById('calendarBody');
  calendarBody.innerHTML = '';

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  document.getElementById('currentMonthYear').textContent = 
    date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  for (let i = 0; i < firstDay; i++) {
    calendarBody.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayCell = document.createElement('div');
    dayCell.textContent = d;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasSchedule = schedules.some(s => s.date === dateStr);
    if (hasSchedule) {
      dayCell.style.backgroundColor = 'rgba(74,111,165,0.1)';
    }

    calendarBody.appendChild(dayCell);
  }

  renderScheduleList();
}

function renderScheduleList() {
  const tbody = document.getElementById('scheduleTableBody');
  tbody.innerHTML = '';

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const filterLocation = document.getElementById('locationFilter').value;

  schedules
    .filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year &&
        (filterLocation === 'all' || s.location === filterLocation);
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
        </td>
      `;
      tbody.appendChild(row);
    });
}

// ========== CONTROL HANDLERS ==========
function setupControls() {
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  document.getElementById('locationFilter').addEventListener('change', () => {
    renderCalendar(currentDate);
  });

  document.getElementById('addScheduleBtn').addEventListener('click', () => {
    openModal();
  });
}

// ========== MODAL ==========
function setupModal() {
  const modal = document.getElementById('scheduleModal');
  const closeBtn = modal.querySelector('.close');
  const form = document.getElementById('scheduleForm');

  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    saveSchedule();
  });

  document.getElementById('location').addEventListener('change', e => {
    const group = document.getElementById('locationDetailGroup');
    group.style.display = e.target.value === 'Lapangan' ? 'block' : 'none';
  });

  document.getElementById('deleteBtn').addEventListener('click', () => {
    deleteSchedule(document.getElementById('scheduleId').value);
    closeModal();
  });
}

function openModal(schedule = null) {
  const modal = document.getElementById('scheduleModal');
  const form = document.getElementById('scheduleForm');
  modal.style.display = 'block';

  if (schedule) {
    document.getElementById('modalTitle').textContent = 'Edit Jadwal Nikah';
    document.getElementById('scheduleId').value = schedule.id;
    document.getElementById('groomName').value = schedule.groomName;
    document.getElementById('brideName').value = schedule.brideName;
    document.getElementById('groomPhone').value = schedule.groomPhone;
    document.getElementById('bridePhone').value = schedule.bridePhone;
    document.getElementById('weddingDate').value = schedule.date;
    document.getElementById('weddingTime').value = schedule.time;
    document.getElementById('location').value = schedule.location;
    document.getElementById('locationDetail').value = schedule.locationDetail || '';
    document.getElementById('documentStatus').value = schedule.documentStatus;
    document.getElementById('notes').value = schedule.notes;
    document.getElementById('locationDetailGroup').style.display = schedule.location === 'Lapangan' ? 'block' : 'none';
    document.getElementById('deleteBtn').style.display = 'inline-block';
  } else {
    form.reset();
    document.getElementById('modalTitle').textContent = 'Tambah Jadwal Nikah';
    document.getElementById('scheduleId').value = '';
    document.getElementById('locationDetailGroup').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'none';
  }
}

function closeModal() {
  document.getElementById('scheduleModal').style.display = 'none';
}

// ========== CRUD ==========
function saveSchedule() {
  const id = document.getElementById('scheduleId').value || Date.now().toString();
  const newSchedule = {
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
    schedules[index] = newSchedule;
  } else {
    schedules.push(newSchedule);
  }

  localStorage.setItem('schedules', JSON.stringify(schedules));
  renderCalendar(currentDate);
  closeModal();
}

function editSchedule(id) {
  const schedule = schedules.find(s => s.id === id);
  if (schedule) openModal(schedule);
}

function deleteSchedule(id) {
  schedules = schedules.filter(s => s.id !== id);
  localStorage.setItem('schedules', JSON.stringify(schedules));
  renderCalendar(currentDate);
}
