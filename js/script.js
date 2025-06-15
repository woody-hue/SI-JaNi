document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const DOM = {
        calendarBody: document.getElementById('calendarBody'),
        currentMonthYear: document.getElementById('currentMonthYear'),
        prevMonthBtn: document.getElementById('prevMonthBtn'),
        nextMonthBtn: document.getElementById('nextMonthBtn'),
        addScheduleBtn: document.getElementById('addScheduleBtn'),
        scheduleModal: document.getElementById('scheduleModal'),
        modalClose: document.getElementById('modalClose'),
        scheduleForm: document.getElementById('scheduleForm'),
        scheduleTableBody: document.getElementById('scheduleTableBody'),
        locationFilter: document.getElementById('locationFilter'),
        loggedInUser: document.getElementById('loggedInUser'),
        logoutBtn: document.getElementById('logoutBtn'),
        deleteBtn: document.getElementById('deleteBtn')
    };

    // State aplikasi
    let currentDate = new Date();
    let schedules = JSON.parse(localStorage.getItem('weddingSchedules')) || [];
    let currentEditingId = null;

    // Inisialisasi
    function init() {
        renderCalendar();
        renderScheduleTable();
        updateUserInfo();
        setupEventListeners();
    }

    // Render kalender
    function renderCalendar() {
        DOM.calendarBody.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        DOM.currentMonthYear.textContent = new Intl.DateTimeFormat('id-ID', {
            month: 'long',
            year: 'numeric'
        }).format(currentDate);
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Hari dari bulan sebelumnya
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDay; i++) {
            const dayElement = createDayElement(prevMonthDays - firstDay + i + 1, true);
            DOM.calendarBody.appendChild(dayElement);
        }
        
        // Hari bulan ini
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayElement = createDayElement(i, false, date);
            DOM.calendarBody.appendChild(dayElement);
        }
        
        // Hari dari bulan berikutnya
        const totalDays = firstDay + daysInMonth;
        const nextMonthDays = 7 - (totalDays % 7);
        if (nextMonthDays < 7) {
            for (let i = 1; i <= nextMonthDays; i++) {
                const dayElement = createDayElement(i, true);
                DOM.calendarBody.appendChild(dayElement);
            }
        }
    }

    function createDayElement(day, isOtherMonth, date = null) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        if (isOtherMonth) dayElement.classList.add('other-month');
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
        `;
        
        if (date) {
            const hasEvent = schedules.some(schedule => {
                const scheduleDate = new Date(schedule.weddingDate);
                return (
                    scheduleDate.getDate() === date.getDate() &&
                    scheduleDate.getMonth() === date.getMonth() &&
                    scheduleDate.getFullYear() === date.getFullYear()
                );
            });
            
            if (hasEvent) {
                dayElement.innerHTML += '<div class="event-indicator"></div>';
            }
            
            dayElement.addEventListener('click', () => {
                const filteredDate = schedules.filter(schedule => {
                    const scheduleDate = new Date(schedule.weddingDate);
                    return (
                        scheduleDate.getDate() === date.getDate() &&
                        scheduleDate.getMonth() === date.getMonth() &&
                        scheduleDate.getFullYear() === date.getFullYear()
                    );
                });
                
                if (filteredDate.length > 0) {
                    renderScheduleTable(filteredDate);
                }
            });
        }
        
        return dayElement;
    }

    // Render tabel jadwal
    function renderScheduleTable(filteredSchedules = null) {
        DOM.scheduleTableBody.innerHTML = '';
        
        const schedulesToRender = filteredSchedules || 
            schedules.filter(schedule => {
                const scheduleDate = new Date(schedule.weddingDate);
                return (
                    scheduleDate.getMonth() === currentDate.getMonth() &&
                    scheduleDate.getFullYear() === currentDate.getFullYear()
                );
            });
        
        const filteredByLocation = DOM.locationFilter.value !== 'all' 
            ? schedulesToRender.filter(schedule => schedule.location === DOM.locationFilter.value)
            : schedulesToRender;
        
        if (filteredByLocation.length === 0) {
            DOM.scheduleTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">Tidak ada jadwal untuk ditampilkan</td>
                </tr>
            `;
            return;
        }
        
        filteredByLocation.forEach(schedule => {
            const row = document.createElement('tr');
            const weddingDate = new Date(schedule.weddingDate);
            
            row.innerHTML = `
                <td>${weddingDate.toLocaleDateString('id-ID')}</td>
                <td>${schedule.weddingTime}</td>
                <td>
                    <strong>${schedule.groomName}</strong><br>
                    & <strong>${schedule.brideName}</strong>
                </td>
                <td>${schedule.location}${schedule.locationDetail ? `<br><small>${schedule.locationDetail}</small>` : ''}</td>
                <td>
                    <span class="status-badge ${schedule.documentStatus === 'Lengkap' ? 'status-complete' : 'status-incomplete'}">
                        ${schedule.documentStatus}
                    </span>
                </td>
                <td>
                    <button class="btn-table edit-btn" data-id="${schedule.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-table delete-btn" data-id="${schedule.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            DOM.scheduleTableBody.appendChild(row);
        });
        
        // Tambahkan event listener untuk tombol edit/hapus
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => editSchedule(e.target.closest('button').dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => confirmDeleteSchedule(e.target.closest('button').dataset.id));
        });
    }

    // Form jadwal
    function openScheduleForm(schedule = null) {
        if (schedule) {
            document.getElementById('modalTitle').textContent = 'Edit Jadwal Nikah';
            document.getElementById('scheduleId').value = schedule.id;
            document.getElementById('groomName').value = schedule.groomName;
            document.getElementById('brideName').value = schedule.brideName;
            document.getElementById('weddingDate').value = schedule.weddingDate.split('T')[0];
            document.getElementById('weddingTime').value = schedule.weddingTime;
            document.getElementById('location').value = schedule.location;
            document.getElementById('locationDetail').value = schedule.locationDetail || '';
            document.getElementById('documentStatus').value = schedule.documentStatus;
            document.getElementById('notes').value = schedule.notes || '';
            DOM.deleteBtn.style.display = 'block';
            currentEditingId = schedule.id;
        } else {
            document.getElementById('modalTitle').textContent = 'Tambah Jadwal Nikah';
            document.getElementById('scheduleForm').reset();
            DOM.deleteBtn.style.display = 'none';
            currentEditingId = null;
        }
        
        DOM.scheduleModal.style.display = 'block';
    }

    function saveSchedule(e) {
        e.preventDefault();
        
        const formData = {
            id: document.getElementById('scheduleId').value || Date.now().toString(),
            groomName: document.getElementById('groomName').value.trim(),
            brideName: document.getElementById('brideName').value.trim(),
            weddingDate: document.getElementById('weddingDate').value,
            weddingTime: document.getElementById('weddingTime').value,
            location: document.getElementById('location').value,
            locationDetail: document.getElementById('locationDetail').value.trim(),
            documentStatus: document.getElementById('documentStatus').value,
            notes: document.getElementById('notes').value.trim(),
            createdAt: new Date().toISOString()
        };
        
        if (currentEditingId) {
            // Update existing schedule
            const index = schedules.findIndex(s => s.id === currentEditingId);
            if (index !== -1) {
                schedules[index] = formData;
            }
        } else {
            // Add new schedule
            schedules.push(formData);
        }
        
        localStorage.setItem('weddingSchedules', JSON.stringify(schedules));
        DOM.scheduleModal.style.display = 'none';
        renderCalendar();
        renderScheduleTable();
    }

    function editSchedule(id) {
        const schedule = schedules.find(s => s.id === id);
        if (schedule) {
            openScheduleForm(schedule);
        }
    }

    function confirmDeleteSchedule(id) {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            deleteSchedule(id);
        }
    }

    function deleteSchedule(id) {
        schedules = schedules.filter(s => s.id !== id);
        localStorage.setItem('weddingSchedules', JSON.stringify(schedules));
        
        if (currentEditingId === id) {
            DOM.scheduleModal.style.display = 'none';
            currentEditingId = null;
        }
        
        renderCalendar();
        renderScheduleTable();
    }

    // Navigasi bulan
    function changeMonth(offset) {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + offset,
            1
        );
        renderCalendar();
        renderScheduleTable();
    }

    // User info
    function updateUserInfo() {
        const user = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Admin' };
        DOM.loggedInUser.textContent = user.name;
    }

    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    // Event listeners
    function setupEventListeners() {
        DOM.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        DOM.nextMonthBtn.addEventListener('click', () => changeMonth(1));
        DOM.addScheduleBtn.addEventListener('click', () => openScheduleForm());
        DOM.modalClose.addEventListener('click', () => DOM.scheduleModal.style.display = 'none');
        DOM.scheduleForm.addEventListener('submit', saveSchedule);
        DOM.locationFilter.addEventListener('change', () => renderScheduleTable());
        DOM.logoutBtn.addEventListener('click', logout);
        DOM.deleteBtn.addEventListener('click', () => {
            if (currentEditingId) {
                confirmDeleteSchedule(currentEditingId);
            }
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === DOM.scheduleModal) {
                DOM.scheduleModal.style.display = 'none';
            }
        });
        
        // Show/hide location detail field
        document.getElementById('location').addEventListener('change', function() {
            document.getElementById('locationDetailGroup').style.display = 
                this.value === 'Lapangan' ? 'block' : 'none';
        });
    }

    // Jalankan aplikasi
    init();
});