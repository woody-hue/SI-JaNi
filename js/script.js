// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
    
    if (document.getElementById('loginForm')) {
        setupLoginPage();
    } else if (document.getElementById('scheduleTable')) {
        setupDashboardPage();
    }
});

// USER MANAGEMENT
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

function checkLoginStatus() {
    if (window.location.pathname.endsWith('dashboard.html')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'index.html';
        }
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function checkUserRole() {
    const currentUser = getCurrentUser();
    return currentUser ? currentUser.role : null;
}

// LOGIN PAGE
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = validUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            loginError.textContent = 'Username atau password salah';
        }
    });
}

// DASHBOARD PAGE
function setupDashboardPage() {
    const currentUser = getCurrentUser();
    const userRole = checkUserRole();
    
    // Set UI berdasarkan role
    document.getElementById('loggedInUser').textContent = `Selamat datang, ${currentUser.name} (${userRole})`;
    
    if (userRole === 'pegawai') {
        document.getElementById('addScheduleBtn').style.display = 'none';
        document.querySelectorAll('.action-column').forEach(el => el.style.display = 'none');
    }
    
    // Inisialisasi variabel
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    
    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('addScheduleBtn').addEventListener('click', () => openModal('add'));
    document.getElementById('prevMonthBtn').addEventListener('click', showPreviousMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', showNextMonth);
    document.getElementById('locationFilter').addEventListener('change', renderCalendarAndScheduleList);
    document.querySelector('.close').addEventListener('click', () => closeModal());
    document.getElementById('location').addEventListener('change', toggleLocationDetail);
    document.getElementById('scheduleForm').addEventListener('submit', saveSchedule);
    document.getElementById('deleteBtn').addEventListener('click', deleteSchedule);
    
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('scheduleModal')) {
            closeModal();
        }
    });
    
    // Render data
    renderCalendarAndScheduleList();
    checkUpcomingSchedules();
    
    // FUNGSI UTAMA
    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
    
    function renderCalendarAndScheduleList() {
        renderCalendar(currentMonth, currentYear);
        renderScheduleList(currentMonth, currentYear);
    }
    
    function renderCalendar(month, year) {
        const calendarBody = document.getElementById('calendarBody');
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                          "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        let firstDayIndex = firstDay.getDay();
        
        calendarBody.innerHTML = '';
        
        for (let i = 0; i < firstDayIndex; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'empty');
            calendarBody.appendChild(dayElement);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            dayElement.appendChild(dayNumber);
            
            const daySchedules = getSchedulesForDay(i, month, year);
            daySchedules.forEach(schedule => {
                const scheduleElement = document.createElement('div');
                scheduleElement.classList.add('schedule-item');
                if (schedule.location === 'Lapangan') {
                    scheduleElement.classList.add('lapangan');
                }
                scheduleElement.textContent = `${schedule.time} - ${schedule.groomName} & ${schedule.brideName}`;
                scheduleElement.setAttribute('data-id', schedule.id);
                
                if (userRole === 'admin') {
                    scheduleElement.addEventListener('click', () => openModal('edit', schedule.id));
                }
                
                dayElement.appendChild(scheduleElement);
            });
            
            calendarBody.appendChild(dayElement);
        }
    }
    
    function getSchedulesForDay(day, month, year) {
        const filteredLocation = document.getElementById('locationFilter').value;
        
        return schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate.getDate() === day && 
                   scheduleDate.getMonth() === month && 
                   scheduleDate.getFullYear() === year &&
                   (filteredLocation === 'all' || schedule.location === filteredLocation);
        });
    }
    
    function renderScheduleList(month, year) {
        const scheduleTableBody = document.getElementById('scheduleTableBody');
        const filteredLocation = document.getElementById('locationFilter').value;
        
        const filteredSchedules = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate.getMonth() === month && 
                   scheduleDate.getFullYear() === year &&
                   (filteredLocation === 'all' || schedule.location === filteredLocation);
        }).sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        scheduleTableBody.innerHTML = '';
        
        filteredSchedules.forEach(schedule => {
            const row = document.createElement('tr');
            
            const scheduleDate = new Date(schedule.date);
            const formattedDate = `${scheduleDate.getDate()} ${getMonthName(scheduleDate.getMonth())} ${scheduleDate.getFullYear()}`;
            const phoneNumbers = `${schedule.groomPhone} / ${schedule.bridePhone}`;
            const location = schedule.location === 'KUA' ? 'Kantor KUA' : schedule.locationDetail || 'Lapangan';
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${schedule.time}</td>
                <td>${schedule.groomName}</td>
                <td>${schedule.brideName}</td>
                <td>${phoneNumbers}</td>
                <td>${location}</td>
                <td class="status-${schedule.documentStatus.toLowerCase()}">${schedule.documentStatus}</td>
                <td>${schedule.notes || '-'}</td>
                <td class="action-column">
                    ${userRole === 'admin' ? `
                    <button class="action-btn edit-btn" data-id="${schedule.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${schedule.id}">Hapus</button>
                    ` : '-'}
                </td>
            `;
            
            scheduleTableBody.appendChild(row);
        });
        
        if (userRole === 'admin') {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => openModal('edit', e.target.getAttribute('data-id')));
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
                        deleteScheduleById(e.target.getAttribute('data-id'));
                    }
                });
            });
        }
    }
    
    function getMonthName(monthIndex) {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                          "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return monthNames[monthIndex];
    }
    
    function showPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendarAndScheduleList();
    }
    
    function showNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendarAndScheduleList();
    }
    
    function openModal(action, scheduleId = null) {
        if (userRole !== 'admin') {
            showNotification('Akses ditolak: Hanya admin yang bisa mengedit data', 'error');
            return;
        }
        
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteBtn');
        const form = document.getElementById('scheduleForm');
        
        form.reset();
        
        if (action === 'add') {
            modalTitle.textContent = 'Tambah Jadwal Nikah';
            deleteBtn.style.display = 'none';
            
            const today = new Date();
            document.getElementById('weddingDate').value = today.toISOString().split('T')[0];
            document.getElementById('weddingTime').value = '10:00';
            document.getElementById('notes').value = `Diinput oleh: ${currentUser.name}`;
        } else if (action === 'edit' && scheduleId) {
            modalTitle.textContent = 'Edit Jadwal Nikah';
            deleteBtn.style.display = 'inline-block';
            deleteBtn.setAttribute('data-id', scheduleId);
            
            const schedule = schedules.find(s => s.id === scheduleId);
            if (schedule) {
                document.getElementById('scheduleId').value = schedule.id;
                document.getElementById('groomName').value = schedule.groomName;
                document.getElementById('brideName').value = schedule.brideName;
                document.getElementById('groomPhone').value = schedule.groomPhone;
                document.getElementById('bridePhone').value = schedule.bridePhone;
                document.getElementById('weddingDate').value = schedule.date;
                document.getElementById('weddingTime').value = schedule.time;
                document.getElementById('location').value = schedule.location;
                document.getElementById('documentStatus').value = schedule.documentStatus;
                document.getElementById('notes').value = schedule.notes || '';
                
                if (schedule.location === 'Lapangan') {
                    document.getElementById('locationDetailGroup').style.display = 'block';
                    document.getElementById('locationDetail').value = schedule.locationDetail || '';
                } else {
                    document.getElementById('locationDetailGroup').style.display = 'none';
                }
            }
        }
        
        document.getElementById('scheduleModal').style.display = 'block';
    }
    
    function closeModal() {
        document.getElementById('scheduleModal').style.display = 'none';
    }
    
    function toggleLocationDetail() {
        const locationDetailGroup = document.getElementById('locationDetailGroup');
        locationDetailGroup.style.display = this.value === 'Lapangan' ? 'block' : 'none';
    }
    
    function saveSchedule(e) {
        e.preventDefault();
        
        if (userRole !== 'admin') {
            showNotification('Akses ditolak: Hanya admin yang bisa menyimpan data', 'error');
            return;
        }
        
        const scheduleId = document.getElementById('scheduleId').value;
        const groomName = document.getElementById('groomName').value.trim();
        const brideName = document.getElementById('brideName').value.trim();
        const groomPhone = document.getElementById('groomPhone').value.trim();
        const bridePhone = document.getElementById('bridePhone').value.trim();
        const date = document.getElementById('weddingDate').value;
        const time = document.getElementById('weddingTime').value;
        const location = document.getElementById('location').value;
        const locationDetail = location === 'Lapangan' ? document.getElementById('locationDetail').value.trim() : '';
        const documentStatus = document.getElementById('documentStatus').value;
        const notes = document.getElementById('notes').value.trim();
        
        if (!groomName || !brideName || !groomPhone || !bridePhone || !date || !time) {
            showNotification('Semua field harus diisi kecuali keterangan', 'error');
            return;
        }
        
        if (location === 'Lapangan') {
            const conflictingSchedule = checkScheduleConflict(date, time, scheduleId);
            if (conflictingSchedule) {
                showNotification(`Peringatan: Jadwal bentrok dengan ${conflictingSchedule.groomName} & ${conflictingSchedule.brideName} di ${conflictingSchedule.locationDetail || 'lapangan'}`, 'warning');
                return;
            }
        }
        
        const newSchedule = {
            id: scheduleId || generateId(),
            groomName,
            brideName,
            groomPhone,
            bridePhone,
            date,
            time,
            location,
            locationDetail,
            documentStatus,
            notes,
            createdBy: currentUser.name,
            createdAt: scheduleId ? schedules.find(s => s.id === scheduleId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (scheduleId) {
            schedules = schedules.filter(s => s.id !== scheduleId);
        }
        
        schedules.push(newSchedule);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        
        renderCalendarAndScheduleList();
        closeModal();
        showNotification(`Jadwal untuk ${groomName} & ${brideName} berhasil disimpan`);
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SI-JaNi: Jadwal Baru', {
                body: `Jadwal nikah ${groomName} & ${brideName} pada ${date} ${time} telah ditambahkan`
            });
        }
    }
    
    function deleteSchedule() {
        if (userRole !== 'admin') {
            showNotification('Akses ditolak: Hanya admin yang bisa menghapus data', 'error');
            return;
        }
        
        const scheduleId = this.getAttribute('data-id');
        deleteScheduleById(scheduleId);
    }
    
    function deleteScheduleById(scheduleId) {
        if (userRole !== 'admin') {
            showNotification('Akses ditolak: Hanya admin yang bisa menghapus data', 'error');
            return;
        }
        
        schedules = schedules.filter(s => s.id !== scheduleId);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        renderCalendarAndScheduleList();
        closeModal();
        showNotification('Jadwal berhasil dihapus');
    }
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    function checkScheduleConflict(date, time, excludeId = null) {
        const [hours, minutes] = time.split(':').map(Number);
        const checkMinutes = hours * 60 + minutes;
        
        const sameDateSchedules = schedules.filter(s => {
            return s.date === date && 
                   s.location === 'Lapangan' && 
                   s.id !== excludeId;
        });
        
        for (const schedule of sameDateSchedules) {
            const [schedHours, schedMinutes] = schedule.time.split(':').map(Number);
            const schedMinutesTotal = schedHours * 60 + schedMinutes;
            
            if (Math.abs(checkMinutes - schedMinutesTotal) < 120) {
                return schedule;
            }
        }
        
        return null;
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.display = 'block';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    function checkUpcomingSchedules() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcomingSchedules = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= today && scheduleDate <= nextWeek;
        });
        
        if (upcomingSchedules.length > 0) {
            const count = upcomingSchedules.length;
            showNotification(`Anda memiliki ${count} jadwal nikah dalam 7 hari ke depan`, 'info');
        }
    }
}
