// ------------------ Class Management ------------------
const STORAGE_KEY_CLASSES = 'gymClasses';

function getClassesFromStorage() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CLASSES)) || [];
}

function saveClassesToStorage(data) {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(data));
}

let classes = getClassesFromStorage();
let editingIndex = null;
let deleteTargetId = null;

const classTableBody = document.getElementById('class-table-body');
const classSearch = document.getElementById('class-search');
const classModal = document.getElementById('class-modal');
const confirmClassModal = document.getElementById('confirm-class-modal');
const classForm = document.getElementById('class-form');
const closeBtn = document.querySelector('.close-btn');
const addClassBtn = document.getElementById('add-class-btn');
const confirmDeleteClassBtn = document.getElementById('confirm-delete-class');
const cancelDeleteClassBtn = document.getElementById('cancel-delete-class');
const memberSelect = document.getElementById('member-select');
const enrolledMembersList = document.getElementById('enrolled-members-list');
const addMemberToClassBtn = document.getElementById('add-member-to-class');
const recurringSchedule = document.getElementById('recurring-schedule');
const recurringDetails = document.getElementById('recurring-details');
const repeatUntil = document.getElementById('repeat-until');
const classDuration = document.getElementById('class-duration');

// Load members into the member selection dropdown
function loadMemberOptions() {
    const members = JSON.parse(localStorage.getItem('members')) || [];
    memberSelect.innerHTML = '<option value="">Select Member to Add</option>';
    members.forEach(member => {
        if (member.status === 'Active') {  // Only allow active members to enroll
            memberSelect.innerHTML += `<option value="${member.name}">${member.name} (${member.membership})</option>`;
        }
    });
}

// Add class capacity tracking
function getCapacityIndicator(enrolledCount, capacity) {
    if (capacity === 'unlimited') return 'available';
    const percentage = (enrolledCount / parseInt(capacity)) * 100;
    if (percentage >= 100) return 'full';
    if (percentage >= 80) return 'near-full';
    return 'available';
}

function loadClasses(filter = '') {
    classes = getClassesFromStorage();
    classTableBody.innerHTML = '';
    const filtered = filter
        ? classes.filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            c.coach.toLowerCase().includes(filter.toLowerCase()) ||
            c.category.toLowerCase().includes(filter.toLowerCase())
        )
        : classes;

    filtered.forEach((cls, index) => {
        const enrolledCount = cls.enrolledMembers ? cls.enrolledMembers.length : 0;
        const capacityIndicator = getCapacityIndicator(enrolledCount, cls.capacity);
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${cls.id}</div>
            <div>${cls.name}</div>
            <div>${cls.coach}</div>
            <div>${cls.category}</div>
            <div class="class-status ${cls.status.toLowerCase()}">${cls.status}</div>
            <div>
                <span class="capacity-indicator ${capacityIndicator}">
                    ${enrolledCount}/${cls.capacity || '∞'}
                </span>
            </div>
            <div class="actions">
                <i class="fas fa-eye view-class" title="View Details" data-index="${index}"></i>
                <i class="fas fa-pen edit-class" title="Edit" data-index="${index}"></i>
                <i class="fas fa-trash delete-class" title="Delete" data-id="${cls.id}"></i>
            </div>
        `;
        classTableBody.appendChild(row);
    });

    attachEventListeners();
    updateClassStats();
}

// Add class statistics
function updateClassStats() {
    const totalClasses = classes.length;
    const activeClasses = classes.filter(c => c.status === 'Ongoing').length;
    const totalEnrolled = classes.reduce((sum, cls) =>
        sum + (cls.enrolledMembers ? cls.enrolledMembers.length : 0), 0);

    const statsHtml = `
        <div class="stats-container">
            <div class="stat-card">
                <h2>${totalClasses}</h2>
                <p>Total Classes</p>
            </div>
            <div class="stat-card">
                <h2>${activeClasses}</h2>
                <p>Active Classes</p>
            </div>
            <div class="stat-card">
                <h2>${totalEnrolled}</h2>
                <p>Total Enrollments</p>
            </div>
        </div>
    `;

    // Insert stats before the action bar
    const actionBar = document.querySelector('.action-bar');
    if (!document.querySelector('.stats-container')) {
        actionBar.insertAdjacentHTML('beforebegin', statsHtml);
    } else {
        document.querySelector('.stats-container').outerHTML = statsHtml;
    }
}

// Add attendance stats and reporting
function getAttendanceStats(classId) {
    const cls = classes.find(c => c.id === classId);
    if (!cls || !cls.attendance || !cls.enrolledMembers) return null;

    const totalSessions = Object.keys(cls.attendance).length;
    const totalMembers = cls.enrolledMembers.length;
    let totalPresent = 0;
    let totalAbsent = 0;

    Object.values(cls.attendance).forEach(session => {
        Object.values(session).forEach(record => {
            if (record.status === 'present') totalPresent++;
            else totalAbsent++;
        });
    });

    const attendanceRate = totalMembers > 0 ?
        ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1) : 0;

    return {
        totalSessions,
        totalPresent,
        totalAbsent,
        attendanceRate
    };
}

// Add class attendance tracking
function markAttendance(classId, memberId, status = 'present') {
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return;

    const cls = classes[classIndex];
    if (!cls.attendance) cls.attendance = {};
    if (!cls.attendance[cls.startDate]) cls.attendance[cls.startDate] = {};

    cls.attendance[cls.startDate][memberId] = {
        status,
        timestamp: new Date().toISOString()
    };

    saveClassesToStorage(classes);
    showNotification('Attendance marked successfully');
}

// Check schedule conflicts
function checkScheduleConflicts(startDate, endDate, excludeClassId = null) {
    return classes.filter(cls => {
        if (cls.id === excludeClassId) return false;

        const classStart = new Date(cls.startDate);
        const classEnd = new Date(cls.endDate);
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);

        return (newStart <= classEnd && newEnd >= classStart);
    });
}

// Enhance class form validation
function validateClassSchedule(startDate, endDate, classId = null) {
    const conflicts = checkScheduleConflicts(startDate, endDate, classId);
    if (conflicts.length > 0) {
        const conflictDetails = conflicts.map(c =>
            `${c.name} (${new Date(c.startDate).toLocaleString()} - ${new Date(c.endDate).toLocaleString()})`
        ).join('\n');

        showNotification('Schedule conflicts detected:\n' + conflictDetails, 'error');
        return false;
    }
    return true;
}

// Add batch/series handling for recurring classes
function generateClassSeries(baseClass, recurringType, startDate, endDate, duration) {
    const seriesId = 'S' + Date.now().toString().slice(-6);
    const instances = [];
    const currentDate = new Date(startDate);
    const endRepeat = new Date(endDate);

    while (currentDate <= endRepeat) {
        const classInstance = { ...baseClass };
        classInstance.id = 'CL' + Date.now().toString().slice(-5) + instances.length;
        classInstance.seriesId = seriesId;
        classInstance.startDate = new Date(currentDate).toISOString().slice(0, 16);
        classInstance.endDate = new Date(currentDate.getTime() + duration * 60000).toISOString().slice(0, 16);

        instances.push(classInstance);

        switch (recurringType) {
            case 'daily':
                currentDate.setDate(currentDate.getDate() + 1);
                break;
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + 7);
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + 1);
                break;
        }
    }

    return { seriesId, instances };
}

// Add class view functionality
function viewClassDetails(index) {
    const cls = classes[index];
    const enrolledCount = cls.enrolledMembers ? cls.enrolledMembers.length : 0;
    const hasAttendance = cls.attendance && cls.attendance[cls.startDate];
    const attendanceStats = getAttendanceStats(cls.id);

    const content = `
        <div class="class-details">
            <h3>${cls.name}</h3>
            ${attendanceStats ? `
            <div class="attendance-stats">
                <h4>Attendance Overview</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Total Sessions</label>
                        <span>${attendanceStats.totalSessions}</span>
                    </div>
                    <div class="stat-item">
                        <label>Total Present</label>
                        <span class="present-count">${attendanceStats.totalPresent}</span>
                    </div>
                    <div class="stat-item">
                        <label>Total Absent</label>
                        <span class="absent-count">${attendanceStats.totalAbsent}</span>
                    </div>
                    <div class="stat-item">
                        <label>Attendance Rate</label>
                        <span class="attendance-rate">${attendanceStats.attendanceRate}%</span>
                    </div>
                </div>
            </div>
            ` : ''}
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Coach:</label>
                    <span>${cls.coach}</span>
                </div>
                <div class="detail-item">
                    <label>Category:</label>
                    <span>${cls.category}</span>
                </div>
                <div class="detail-item">
                    <label>Location:</label>
                    <span>${cls.location || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="class-status ${cls.status.toLowerCase()}">${cls.status}</span>
                </div>
                <div class="detail-item">
                    <label>Capacity:</label>
                    <span>${enrolledCount}/${cls.capacity || 'unlimited'}</span>
                </div>
                ${cls.startDate ? `
                <div class="detail-item">
                    <label>Schedule:</label>
                    <span>${new Date(cls.startDate).toLocaleString()} - ${new Date(cls.endDate).toLocaleString()}</span>
                </div>
                ` : ''}
                ${cls.seriesId ? `
                <div class="detail-item">
                    <label>Series ID:</label>
                    <span>${cls.seriesId}</span>
                </div>
                ` : ''}
            </div>
            ${cls.description ? `
            <div class="description-section">
                <h4>Description</h4>
                <p>${cls.description}</p>
            </div>
            ` : ''}
            <div class="enrolled-section">
                <h4>Enrolled Members</h4>
                ${cls.status === 'Ongoing' ? `
                <div class="attendance-actions">
                    <button onclick="markAllPresent('${cls.id}')" class="mark-all-btn">
                        Mark All Present
                    </button>
                    <button onclick="exportAttendance('${cls.id}')" class="export-btn">
                        Export Attendance
                    </button>
                </div>
                ` : ''}
                <div class="enrolled-members-grid">
                    ${cls.enrolledMembers ? cls.enrolledMembers.map(member => `
                        <div class="member-item">
                            <span>${member}</span>
                            ${hasAttendance ? `
                            <div class="attendance-status ${cls.attendance[cls.startDate][member]?.status || 'absent'}">
                                ${cls.attendance[cls.startDate][member]?.status || 'Absent'}
                            </div>
                            ` : ''}
                            ${cls.status === 'Ongoing' ? `
                            <button onclick="markAttendance('${cls.id}', '${member}')" class="mark-attendance-btn">
                                Mark Present
                            </button>
                            ` : ''}
                        </div>
                    `).join('') : '<p>No members enrolled</p>'}
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-box">
            <span class="close-btn">&times;</span>
            ${content}
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('show');

    modal.querySelector('.close-btn').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    };
}

// Add bulk attendance marking
function markAllPresent(classId) {
    const cls = classes.find(c => c.id === classId);
    if (!cls || !cls.enrolledMembers) return;

    if (!cls.attendance) cls.attendance = {};
    if (!cls.attendance[cls.startDate]) cls.attendance[cls.startDate] = {};

    cls.enrolledMembers.forEach(member => {
        cls.attendance[cls.startDate][member] = {
            status: 'present',
            timestamp: new Date().toISOString()
        };
    });

    saveClassesToStorage(classes);
    showNotification('Marked all members present');
    viewClassDetails(classes.findIndex(c => c.id === classId));
}

// Add attendance export functionality
function exportAttendance(classId) {
    const cls = classes.find(c => c.id === classId);
    if (!cls || !cls.attendance) return;

    const rows = [['Date', 'Member', 'Status', 'Time']];

    Object.entries(cls.attendance).forEach(([date, records]) => {
        Object.entries(records).forEach(([member, record]) => {
            rows.push([
                new Date(date).toLocaleDateString(),
                member,
                record.status,
                new Date(record.timestamp).toLocaleTimeString()
            ]);
        });
    });

    const csvContent = "data:text/csv;charset=utf-8," +
        rows.map(row => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${cls.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Attendance report exported successfully');
}

// Enhanced form submission with capacity and recurring schedule handling
classForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const startDate = document.getElementById('class-start-date').value;
    const endDate = document.getElementById('class-end-date').value;

    // Validate schedule
    if (!validateClassSchedule(startDate, endDate, editingIndex !== null ? classes[editingIndex].id : null)) {
        return;
    }

    const baseClass = {
        id: editingIndex !== null ? classes[editingIndex].id : 'CL' + Date.now().toString().slice(-5),
        name: document.getElementById('class-name').value,
        coach: document.getElementById('class-coach').value,
        category: document.getElementById('class-category').value,
        description: document.getElementById('class-description').value,
        location: document.getElementById('class-location').value,
        status: document.getElementById('class-status').value,
        capacity: document.getElementById('class-capacity').value || 'unlimited',
        duration: document.getElementById('class-duration').value,
        enrolledMembers: Array.from(enrolledMembersList.children).map(memberDiv =>
            memberDiv.querySelector('span').textContent)
    };

    // Check capacity before saving
    if (baseClass.capacity !== 'unlimited' &&
        baseClass.enrolledMembers.length > parseInt(baseClass.capacity)) {
        showNotification('Cannot exceed class capacity. Please remove some members or increase capacity.', 'error');
        return;
    }

    const recurring = recurringSchedule.value;
    if (!recurring) {
        // Single class
        baseClass.startDate = startDate;
        baseClass.endDate = endDate;

        if (editingIndex !== null) {
            classes[editingIndex] = baseClass;
        } else {
            classes.unshift(baseClass);
        }
    } else {
        // Generate series
        const { seriesId, instances } = generateClassSeries(
            baseClass,
            recurring,
            startDate,
            repeatUntil.value,
            parseInt(classDuration.value)
        );

        if (editingIndex !== null) {
            // Replace existing class with first instance
            classes[editingIndex] = instances[0];
            // Add remaining instances
            classes.push(...instances.slice(1));
        } else {
            classes.unshift(...instances);
        }

        showNotification(`Created ${instances.length} recurring classes in series ${seriesId}`);
    }

    saveClassesToStorage(classes);
    loadClasses(classSearch.value);
    classModal.classList.remove('show');
    classForm.reset();
    recurringDetails.style.display = 'none';
    editingIndex = null;
});

// Add member limit check
addMemberToClassBtn.addEventListener('click', () => {
    const selectedMember = memberSelect.value;
    if (!selectedMember) return;

    const existingMembers = Array.from(enrolledMembersList.children).map(div =>
        div.querySelector('span').textContent
    );

    if (existingMembers.includes(selectedMember)) {
        showNotification('Member is already enrolled in this class', 'warning');
        return;
    }

    const capacity = document.getElementById('class-capacity').value;
    if (capacity !== '' && existingMembers.length >= parseInt(capacity)) {
        showNotification('Class capacity reached. Cannot add more members.', 'error');
        return;
    }

    const memberDiv = document.createElement('div');
    memberDiv.className = 'enrolled-member';
    memberDiv.innerHTML = `
        <span>${selectedMember}</span>
        <span class="remove-member" data-member="${selectedMember}">
            <i class="fas fa-times"></i>
        </span>
    `;
    enrolledMembersList.appendChild(memberDiv);
    memberSelect.value = '';
    showNotification('Member added to class');
});

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update class status automatically based on date/time
function updateClassStatuses() {
    const now = new Date();
    classes = classes.map(cls => {
        if (cls.startDate && cls.endDate) {
            const startDate = new Date(cls.startDate);
            const endDate = new Date(cls.endDate);

            if (now < startDate) {
                cls.status = 'Scheduled';
            } else if (now >= startDate && now <= endDate) {
                cls.status = 'Ongoing';
            } else {
                cls.status = 'Finished';
            }
        }
        return cls;
    });

    saveClassesToStorage(classes);
    loadClasses(classSearch.value);
}

// Attach event listeners
function attachEventListeners() {
    document.querySelectorAll('.edit-class').forEach(btn =>
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            const c = classes[index];
            editingIndex = index;

            document.getElementById('class-name').value = c.name;
            document.getElementById('class-coach').value = c.coach;
            document.getElementById('class-category').value = c.category;
            document.getElementById('class-description').value = c.description || '';
            document.getElementById('class-location').value = c.location || '';
            document.getElementById('class-status').value = c.status;
            document.getElementById('class-capacity').value = c.capacity || '';
            document.getElementById('class-start-date').value = c.startDate || '';
            document.getElementById('class-end-date').value = c.endDate || '';
            document.getElementById('class-duration').value = c.duration || '';

            // Clear recurring schedule when editing
            document.getElementById('recurring-schedule').value = '';
            recurringDetails.style.display = 'none';

            enrolledMembersList.innerHTML = '';
            if (c.enrolledMembers) {
                c.enrolledMembers.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'enrolled-member';
                    memberDiv.innerHTML = `
                        <span>${member}</span>
                        <span class="remove-member" data-member="${member}">&times;</span>
                    `;
                    enrolledMembersList.appendChild(memberDiv);
                });
            }

            loadMemberOptions();  // Load members when editing
            document.getElementById('modal-title').textContent = 'Edit Class';
            classModal.classList.add('show');
        })
    );

    document.querySelectorAll('.delete-class').forEach(btn =>
        btn.addEventListener('click', (e) => {
            deleteTargetId = e.target.dataset.id;
            confirmClassModal.classList.add('show');
        })
    );

    document.querySelectorAll('.view-class').forEach(btn =>
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            viewClassDetails(index);
        })
    );

    recurringSchedule.addEventListener('change', () => {
        recurringDetails.style.display = recurringSchedule.value ? 'block' : 'none';
    });

    classDuration.addEventListener('input', () => {
        const startDate = document.getElementById('class-start-date').value;
        if (startDate && classDuration.value) {
            const start = new Date(startDate);
            const end = new Date(start.getTime() + parseInt(classDuration.value) * 60000);
            document.getElementById('class-end-date').value = end.toISOString().slice(0, 16);
        }
    });
}

// Event Listeners
confirmDeleteClassBtn.addEventListener('click', () => {
    if (deleteTargetId) {
        deleteClass(deleteTargetId);
        deleteTargetId = null;
    }
    confirmClassModal.classList.remove('show');
});

cancelDeleteClassBtn.addEventListener('click', () => {
    deleteTargetId = null;
    confirmClassModal.classList.remove('show');
});

classSearch.addEventListener('input', () => loadClasses(classSearch.value));

addClassBtn.addEventListener('click', () => {
    classForm.reset();
    editingIndex = null;
    enrolledMembersList.innerHTML = '';
    loadMemberOptions();  // Load members when opening the modal
    document.getElementById('modal-title').textContent = 'Add New Class';
    classModal.classList.add('show');
});

closeBtn.addEventListener('click', () => {
    classModal.classList.remove('show');
    editingIndex = null;
});

window.addEventListener('click', (e) => {
    if (e.target === classModal) classModal.classList.remove('show');
    if (e.target === confirmClassModal) confirmClassModal.classList.remove('show');
});

enrolledMembersList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-member')) {
        e.target.parentElement.remove();
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href = '/';
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadClasses();
    loadMemberOptions();
    setInterval(updateClassStatuses, 60000);
});

//logout
const logoutBtn = document.getElementById('logout-btn');
console.log("Logout button:", logoutBtn);
logoutBtn.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default form behavior (if any)
  console.log("Button clicked!"); // Check if this appears in console
  window.location.href = '/';
});