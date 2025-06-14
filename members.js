// members.js

let members = [];
let logs = JSON.parse(localStorage.getItem('memberLogs')) || [];
let classes = JSON.parse(localStorage.getItem('gymClasses')) || [];
let editingIndex = null;
let deleteTargetId = null;
let currentPage = 1;
let rowsPerPage = 10; // Default rows per page
let filteredMembers = [];

const memberTableBody = document.getElementById('member-table-body');
const memberForm = document.getElementById('member-form');
const memberSearch = document.getElementById('member-search');
const membershipFilter = document.getElementById('membership-filter');
const statusFilter = document.getElementById('status-filter');
const paginationContainer = document.getElementById('pagination');
const analyticsBar = document.getElementById('analytics-bar');

// Add membership types configuration
const MEMBERSHIP_TYPES = {
    Gold: {
        classLimit: 20,
        trainerSessions: 8,
        equipmentAccess: 'premium',
        price: 199.99
    },
    Silver: {
        classLimit: 12,
        trainerSessions: 4,
        equipmentAccess: 'standard',
        price: 129.99
    },
    Basic: {
        classLimit: 8,
        trainerSessions: 2,
        equipmentAccess: 'basic',
        price: 79.99
    }
};

function saveMembers() {
    localStorage.setItem('members', JSON.stringify(members));
}

function saveLogs() {
    localStorage.setItem('memberLogs', JSON.stringify(logs));
}

function addLog(action, member) {
    logs.unshift({ action, id: member.id, time: new Date().toLocaleString() });
    saveLogs();
}

function getNextId() {
    if (members.length === 0) return 'M1';
    const ids = members.map(m => parseInt(m.id.replace("M", ""))).filter(n => !isNaN(n));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `M${max + 1}`;
}

function updateAnalytics() {
    document.getElementById('total-count').textContent = members.length;
    document.getElementById('active-count').textContent = members.filter(m => m.status === 'Active').length;
    document.getElementById('expired-count').textContent = members.filter(m => m.status === 'Expired').length;
    let types = members.reduce((acc, m) => { acc[m.membership] = (acc[m.membership] || 0) + 1; return acc; }, {});
    let popular = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('popular-type').textContent = popular ? popular[0] : 'N/A';
}

function updateMembershipStatus() {
    const today = new Date();
    members.forEach(member => {
        const expiryDate = new Date(member.expiryDate);
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        member.expiryCountdown = diffDays;

        if (diffDays < 0) {
            member.status = 'Expired';
        } else if (diffDays <= 7) {
            showNotification(`${member.name}'s membership expires in ${diffDays} days`);
        }
    });
    saveMembers();
}

function getExpiryInfo(member) {
    if (member.status === 'Expired') {
        return `(${-member.expiryCountdown}d ago)`;
    } else {
        return `(Expires in ${member.expiryCountdown}d)`;
    }
}

function showNotification(message) {
    const popup = document.getElementById('popup-notification');
    popup.textContent = message;
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 500);
    }, 3000);
}

// Add CSS animation to the existing notification popup
const style = document.createElement('style');
style.textContent = `
@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}
#popup-notification {
    animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}`;
document.head.appendChild(style);

function loadLogs() {
    document.getElementById('activity-log-content').innerHTML = logs.map(l => `<p>${l.time}: ${l.action} [${l.id}]</p>`).join('') || 'No activity yet.';
}

// Function to get member's enrolled classes
function getMemberClasses(memberName) {
    const classes = JSON.parse(localStorage.getItem('gymClasses')) || [];
    return classes.filter(cls => cls.enrolledMembers && cls.enrolledMembers.includes(memberName));
}

function loadMembers(filter = '') {
    let storedMembers = localStorage.getItem('members');
    members = storedMembers ? JSON.parse(storedMembers) : [];

    const membershipValue = membershipFilter.value;
    const statusValue = statusFilter.value;

    filteredMembers = members.filter(m => {
        const matchesSearch = !filter ||
            m.name.toLowerCase().includes(filter.toLowerCase()) ||
            m.email.toLowerCase().includes(filter.toLowerCase()) ||
            m.id.toString().includes(filter);

        const matchesMembership = !membershipValue || m.membership === membershipValue;
        const matchesStatus = !statusValue || m.status === statusValue;

        return matchesSearch && matchesMembership && matchesStatus;
    });

    updateMembershipStatus();

    filteredMembers.sort((a, b) => new Date(b.registeredDate) - new Date(a.registeredDate));

    let totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;

    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'pagination-info';
    paginationInfo.innerHTML = `Showing ${start + 1}-${Math.min(end, filteredMembers.length)} of ${filteredMembers.length} members`;
    document.querySelector('.pagination').prepend(paginationInfo);

    const rowsSelector = document.createElement('select');
    rowsSelector.className = 'rows-per-page';
    rowsSelector.innerHTML = `
        <option value="5">5 per page</option>
        <option value="10" selected>10 per page</option>
        <option value="25">25 per page</option>
        <option value="50">50 per page</option>
    `;
    rowsSelector.addEventListener('change', (e) => {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1;
        loadMembers(filter);
    });
    document.querySelector('.pagination').appendChild(rowsSelector);

    memberTableBody.innerHTML = '';
    filteredMembers.slice(start, end).forEach((m, i) => {
        const enrolledClasses = getMemberClasses(m.name);
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
        <div><input type="checkbox" class="select-member" data-id="${m.id}"></div>
        <div>${m.id}</div>
        <div>${m.name}</div>
        <div>${m.email}</div>
        <div>${m.membership}</div>
        <div class="status ${m.status.toLowerCase()}">${m.status} ${getExpiryInfo(m)}</div>
        <div>${m.registeredDate}</div>
        <div>${enrolledClasses.length} classes</div>
        <div class="actions">
          <i class="fas fa-envelope send-reminder" title="Send Reminder" data-id="${m.id}"></i>
          <i class="fas fa-eye view-profile" title="View" data-id="${m.id}"></i>
          <i class="fas fa-pen edit-member" title="Edit" data-index="${members.indexOf(m)}"></i>
          ${m.status === 'Expired' ? `<i class="fas fa-sync-alt renew-member" title="Renew Membership" data-id="${m.id}"></i>` : ''}
          <i class="fas fa-trash delete-member" title="Delete" data-id="${m.id}"></i>
        </div>`;
        memberTableBody.appendChild(row);
    });

    updateAnalytics();
    renderPagination(totalPages);
    loadLogs();

    document.querySelectorAll('.edit-member').forEach(btn => btn.onclick = () => openEditForm(btn.dataset.index));
    document.querySelectorAll('.delete-member').forEach(btn => btn.onclick = () => {
        deleteTargetId = btn.dataset.id;
        document.getElementById('confirm-member-modal').classList.add('show');
    });
    document.querySelectorAll('.view-profile').forEach(btn => btn.onclick = () => viewProfile(btn.dataset.id));
    document.querySelectorAll('.send-reminder').forEach(btn => btn.onclick = () => {
        const memberId = btn.dataset.id;
        const member = members.find(m => m.id === memberId);
        if (member) {
            showNotification(`Reminder email sent to ${member.name} (${member.email})`);
            addLog('Reminder Sent', member);
        }
    });
    document.querySelectorAll('.renew-member').forEach(btn => btn.onclick = () => renewMembership(btn.dataset.id));
}

function renderPagination(totalPages) {
    paginationContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        let btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === currentPage) ? 'active' : '';
        btn.onclick = () => { currentPage = i; loadMembers(memberSearch.value); };
        paginationContainer.appendChild(btn);
    }
}

function openEditForm(index) {
    let m = members[index];
    document.getElementById('member-id').value = m.id;
    document.getElementById('member-name').value = m.name;
    document.getElementById('member-email').value = m.email;
    document.getElementById('member-type').value = m.membership;
    document.getElementById('member-status').value = m.status;
    document.getElementById('class-limit').value = m.benefits.classLimit || 0;
    document.getElementById('classes-attended').value = m.benefits.classesAttended || 0;
    document.getElementById('equipment-access').value = m.benefits.equipmentAccess || '';
    document.getElementById('trainer-sessions').value = m.benefits.trainerSessions || 0;
    editingIndex = index;
    document.getElementById('modal-title').textContent = 'Edit Member';
    document.getElementById('member-modal').classList.add('show');
}

function viewProfile(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    const enrolledClasses = getMemberClasses(member.name);
    const remainingClasses = member.benefits.classLimit - (member.benefits.classesAttended || 0);

    document.getElementById('profile-content').innerHTML = `
        <div class="profile-details">
            <div class="member-info">
                <h3>Member Information</h3>
                <p><strong>ID:</strong> ${member.id}</p>
                <p><strong>Name:</strong> ${member.name}</p>
                <p><strong>Email:</strong> ${member.email}</p>
                <p><strong>Membership:</strong> ${member.membership}</p>
                <p><strong>Status:</strong> <span class="status ${member.status.toLowerCase()}">${member.status}</span></p>
                <p><strong>Registered:</strong> ${member.registrationDate}</p>
            </div>

            <div class="benefits-info">
                <h3>Membership Benefits</h3>
                <div class="benefits-grid">
                    <div class="benefit-item">
                        <span class="benefit-label">Monthly Class Limit:</span>
                        <span class="benefit-value">${member.benefits.classLimit}</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-label">Classes Attended:</span>
                        <span class="benefit-value">${member.benefits.classesAttended || 0} (${remainingClasses} remaining)</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-label">Equipment Access:</span>
                        <span class="benefit-value">${member.benefits.equipmentAccess}</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-label">PT Sessions:</span>
                        <span class="benefit-value">${member.benefits.ptSessionsRemaining} remaining</span>
                    </div>
                </div>
            </div>

            <div class="actions-panel">
                <button onclick="recordClassAttendance('${member.id}')"
                        class="action-btn ${remainingClasses <= 0 ? 'disabled' : ''}"
                        ${remainingClasses <= 0 ? 'disabled' : ''}>
                    Record Class Attendance
                </button>
                <button onclick="usePTSession('${member.id}')"
                        class="action-btn ${member.benefits.ptSessionsRemaining <= 0 ? 'disabled' : ''}"
                        ${member.benefits.ptSessionsRemaining <= 0 ? 'disabled' : ''}>
                    Use PT Session
                </button>
            </div>

            <div class="enrolled-classes">
                <h3>Enrolled Classes</h3>
                <div class="classes-grid">
                    ${enrolledClasses.length > 0 ? enrolledClasses.map(cls => `
                        <div class="class-card">
                            <div class="class-header">
                                <h4>${cls.name}</h4>
                                <span class="class-status ${cls.status.toLowerCase()}">${cls.status}</span>
                            </div>
                            <div class="class-details">
                                <p><i class="fas fa-user-tie"></i> ${cls.coach}</p>
                                <p><i class="fas fa-tag"></i> ${cls.category}</p>
                                <p><i class="fas fa-calendar"></i> ${new Date(cls.startDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    `).join('') : '<p class="no-classes">Not enrolled in any classes</p>'}
                </div>
            </div>
        </div>
    `;
    document.getElementById('profile-modal').classList.add('show');
}

function recordClassAttendance(id) {
    const memberIndex = members.findIndex(m => m.id === id);
    if (memberIndex === -1) return;

    const member = members[memberIndex];
    if (member.benefits.classesAttended < member.benefits.classLimit) {
        member.benefits.classesAttended++;
        saveMembers();
        addLog('Class Attended', member);
        viewProfile(id); // Refresh profile view
        showNotification(`Class attendance recorded for ${member.name}`);
    }
}

function usePTSession(id) {
    const memberIndex = members.findIndex(m => m.id === id);
    if (memberIndex === -1) return;

    const member = members[memberIndex];
    if (member.benefits.trainerSessions > 0) {
        member.benefits.trainerSessions--;
        saveMembers();
        addLog('PT Session Used', member);
        viewProfile(id); // Refresh profile view
        showNotification(`PT session used for ${member.name}`);
    }
}

// Add monthly reset for class attendance
function resetMonthlyBenefits() {
    const today = new Date();
    const lastReset = localStorage.getItem('lastBenefitsReset');

    if (!lastReset || new Date(lastReset).getMonth() !== today.getMonth()) {
        members.forEach(member => {
            member.benefits.classesAttended = 0;
        });
        saveMembers();
        localStorage.setItem('lastBenefitsReset', today.toISOString());
        showNotification('Monthly class attendance has been reset');
    }
}

// Call reset check on page load
window.addEventListener('load', resetMonthlyBenefits);

// Enhance setBenefitsByMembership function
function setBenefitsByMembership(membershipType) {
    const benefits = MEMBERSHIP_TYPES[membershipType] || MEMBERSHIP_TYPES.Basic;

    document.getElementById('class-limit').value = benefits.classLimit;
    document.getElementById('trainer-sessions').value = benefits.trainerSessions;
    document.getElementById('equipment-access').value = benefits.equipmentAccess;

    // Update price display if it exists
    const priceDisplay = document.getElementById('membership-price');
    if (priceDisplay) {
        priceDisplay.textContent = `$${benefits.price}/month`;
    }
}

function getMembershipSuggestion(benefits) {
    if (benefits.classLimit >= 20 && benefits.trainerSessions >= 8 && benefits.equipmentAccess === 'premium') {
        return 'Gold';
    } else if (benefits.classLimit >= 12 && benefits.trainerSessions >= 4 && benefits.equipmentAccess === 'standard') {
        return 'Silver';
    }
    return 'Basic';
}

// Add event listener for membership type changes
document.getElementById('member-type').addEventListener('change', function (e) {
    if (!editingIndex) {  // Only for new members
        setBenefitsByMembership(e.target.value);
    }
});

// Add member form submission handler
memberForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const membershipType = document.getElementById('member-type').value;
    const membershipBenefits = MEMBERSHIP_TYPES[membershipType] || MEMBERSHIP_TYPES.Basic;

    const member = {
        id: document.getElementById('member-id').value || getNextId(),
        name: document.getElementById('member-name').value,
        email: document.getElementById('member-email').value,
        membership: membershipType,
        status: document.getElementById('member-status').value || 'Active',
        registrationDate: new Date().toLocaleDateString(),
        benefits: {
            ...membershipBenefits,
            classesAttended: 0,
            ptSessionsRemaining: membershipBenefits.trainerSessions
        },
        paymentStatus: 'Active',
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    if (editingIndex !== null) {
        // Preserve existing counts when editing
        member.benefits.classesAttended = members[editingIndex].benefits?.classesAttended || 0;
        member.benefits.ptSessionsRemaining = members[editingIndex].benefits?.ptSessionsRemaining || membershipBenefits.trainerSessions;
        members[editingIndex] = member;
        addLog('Updated', member);
        showNotification(`Member ${member.name} updated successfully`);
    } else {
        members.push(member);
        addLog('Added', member);
        showNotification(`Member ${member.name} added successfully`);
    }

    saveMembers();
    loadMembers(memberSearch.value);
    document.getElementById('member-modal').classList.remove('show');
    memberForm.reset();
    editingIndex = null;
});

// When clicking Add Member button
document.getElementById('add-member-btn').onclick = () => {
    memberForm.reset();
    editingIndex = null;
    document.getElementById('member-id').value = getNextId();
    document.getElementById('modal-title').textContent = 'Add New Member';
    document.getElementById('member-modal').classList.add('show');
    // Set default values
    document.getElementById('member-status').value = 'Active';
    setBenefitsByMembership('Basic');
};

document.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => btn.closest('.modal').classList.remove('show'));

document.getElementById('confirm-delete-member').onclick = () => {
    deleteMember(deleteTargetId);
    deleteTargetId = null;
    document.getElementById('confirm-member-modal').classList.remove('show');
};

document.getElementById('cancel-delete-member').onclick = () => document.getElementById('confirm-member-modal').classList.remove('show');

document.getElementById('member-search').oninput = () => loadMembers(memberSearch.value);
document.getElementById('membership-filter').onchange = () => loadMembers(memberSearch.value);
document.getElementById('status-filter').onchange = () => loadMembers(memberSearch.value);

document.getElementById('delete-selected').onclick = () => {
    const selected = [...document.querySelectorAll('.select-member:checked')].map(cb => cb.dataset.id);
    if (selected.length === 0) return alert('No members selected.');
    selected.forEach(id => deleteMember(id));
};

document.getElementById('select-all').onchange = (e) => {
    document.querySelectorAll('.select-member').forEach(cb => cb.checked = e.target.checked);
};

document.getElementById('export-csv').onclick = () => {
    const headers = ['ID', 'Name', 'Email', 'Membership', 'Status', 'Registered'];
    const rows = members.map(m => [m.id, m.name, m.email, m.membership, m.status, m.registeredDate]);
    let csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'members.csv';
    link.click();
    URL.revokeObjectURL(url);
};

document.getElementById('import-csv').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        const lines = event.target.result.split('\n');
        const [header, ...rows] = lines;
        const newMembers = rows.map(r => {
            const [id, name, email, membership, status, registeredDate] = r.split(',').map(v => v.trim());
            return { id, name, email, membership, status, registeredDate };
        }).filter(m => m.id && m.email);
        members = [...members, ...newMembers.filter(n => !members.some(m => m.id === n.id))];
        saveMembers();
        loadMembers();
    };
    reader.readAsText(file);
});

function renewMembership(id) {
    const memberIndex = members.findIndex(m => m.id === id);
    if (memberIndex === -1) return;

    const member = members[memberIndex];
    // Set new expiry date to 1 month from now
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    member.expiryDate = expiryDate.toISOString();
    member.status = 'Active';
    member.expiryCountdown = 30; // Reset countdown to 30 days

    saveMembers();
    loadMembers(memberSearch.value);
    addLog('Renewed Membership', member);
    showNotification(`Membership renewed for ${member.name}`);
}

function deleteMember(id) {
    const memberToDelete = members.find(m => m.id === id);
    if (memberToDelete) {
        // Remove member from all classes
        const classes = JSON.parse(localStorage.getItem('gymClasses')) || [];
        const updatedClasses = classes.map(cls => ({
            ...cls,
            enrolledMembers: cls.enrolledMembers ? cls.enrolledMembers.filter(m => m !== memberToDelete.name) : []
        }));
        localStorage.setItem('gymClasses', JSON.stringify(updatedClasses));
    }

    members = members.filter(m => m.id !== id);
    saveMembers();
    loadMembers(memberSearch.value);
    addLog('Deleted', { id });
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('send-reminder')) {
        const memberId = e.target.dataset.id;
        const member = members.find(m => m.id === memberId);
        if (member) {
            showNotification(`Reminder email sent to ${member.name} (${member.email})`);
            addLog('Reminder Sent', member);
        }
    } else if (e.target.classList.contains('renew-member')) {
        renewMembership(e.target.dataset.id);
    }
});

window.onload = () => loadMembers();

    //logout
   const logoutBtn = document.getElementById('logout-btn');
console.log("Logout button:", logoutBtn); // Should print the HTML element
    logoutBtn.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default form behavior (if any)
  console.log("Button clicked!"); // Check if this appears in console
  window.location.href = '/';
});