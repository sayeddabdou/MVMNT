document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const memberSearch = document.getElementById('member-search');
    const membershipFilter = document.getElementById('membership-filter');
    const statusFilter = document.getElementById('status-filter');
    const addMemberBtn = document.getElementById('add-member-btn');
    const memberModal = document.getElementById('member-modal');
    const memberForm = document.getElementById('member-form');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = memberModal.querySelector('.close-btn');
    const confirmModal = document.getElementById('confirm-member-modal');
    const profileModal = document.getElementById('profile-modal');
    const profileCloseBtn = document.getElementById('profile-close');
    const deleteSelectedBtn = document.getElementById('delete-selected');
    const selectAllCheckbox = document.getElementById('select-all');

    // Filter functionality
    function filterMembers() {
        const searchTerm = memberSearch.value.toLowerCase();
        const membershipValue = membershipFilter.value;
        const statusValue = statusFilter.value;
        const rows = document.querySelectorAll('.table-body .table-row');

        rows.forEach(row => {
            const id = row.children[1].textContent.toLowerCase();
            const name = row.children[2].textContent.toLowerCase();
            const email = row.children[3].textContent.toLowerCase();
            const membership = row.children[4].textContent;
            const status = row.children[5].textContent;

            const matchesSearch = id.includes(searchTerm) || 
                                name.includes(searchTerm) || 
                                email.includes(searchTerm);
            const matchesMembership = !membershipValue || membership === membershipValue;
            const matchesStatus = !statusValue || status === statusValue;

            row.style.display = matchesSearch && matchesMembership && matchesStatus ? '' : 'none';
        });
    }

    // Event listeners for filters
    if (memberSearch) memberSearch.addEventListener('input', filterMembers);
    if (membershipFilter) membershipFilter.addEventListener('change', filterMembers);
    if (statusFilter) statusFilter.addEventListener('change', filterMembers);

    // Modal handling
    function openModal(mode = 'add', memberData = null) {
        modalTitle.textContent = mode === 'add' ? 'Add New Member' : 'Edit Member';
        if (memberData) {
            document.getElementById('member-id').value = memberData.id;
            document.getElementById('member-name').value = memberData.name;
            document.getElementById('member-email').value = memberData.email;
            document.getElementById('member-type').value = memberData.membershipType;
            document.getElementById('member-status').value = memberData.status;
            document.getElementById('class-limit').value = memberData.classLimit || 0;
            document.getElementById('classes-attended').value = memberData.classesAttended || 0;
            document.getElementById('equipment-access').value = memberData.equipmentAccess || 'basic';
            document.getElementById('trainer-sessions').value = memberData.trainerSessions || 0;
            memberForm._method.value = 'PUT';
        } else {
            memberForm.reset();
            memberForm._method.value = 'POST';
        }
        memberModal.style.display = 'flex';
        memberModal.classList.add('show');
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        if (modal === memberModal) {
            memberForm.reset();
        }
    }

    // Event listeners for modal
    if (addMemberBtn) addMemberBtn.addEventListener('click', () => openModal('add'));
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(memberModal));
    window.addEventListener('click', (e) => {
        if (e.target === memberModal) closeModal(memberModal);
        if (e.target === profileModal) closeModal(profileModal);
    });

    // Handle form submission
    if (memberForm) {
        memberForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const method = formData.get('_method');

            try {
                const response = await fetch('/admin/members', {
                    method: method === 'PUT' ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to save member');
                }

                alert('Member saved successfully!');
                closeModal(memberModal);
                location.reload();
            } catch (error) {
                console.error('Error saving member:', error);
                alert('Error saving member: ' + error.message);
            }
        });
    }

    // Handle action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const row = this.closest('.table-row');
            const memberId = this.dataset.id;
            const memberData = {
                id: memberId,
                name: row.children[2].textContent,
                email: row.children[3].textContent,
                membershipType: row.children[4].textContent,
                status: row.children[5].textContent,
                registeredDate: row.children[6].textContent,
                enrolledClasses: parseInt(row.children[7].textContent)
            };

            if (this.classList.contains('view-member')) {
                // Show member profile in modal
                profileModal.style.display = 'flex';
                profileModal.classList.add('show');
            } 
            else if (this.classList.contains('edit-member')) {
                openModal('edit', memberData);
            }
            else if (this.classList.contains('delete-member')) {
                if (confirm('Are you sure you want to delete this member?')) {
                    try {
                        const response = await fetch(`/admin/members/${memberId}`, {
                            method: 'DELETE'
                        });

                        const result = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(result.error || 'Failed to delete member');
                        }

                        row.remove();
                        alert('Member deleted successfully!');
                    } catch (error) {
                        console.error('Error deleting member:', error);
                        alert('Error deleting member: ' + error.message);
                    }
                }
            }
        });
    });

    // Handle select all checkbox
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            document.querySelectorAll('.member-select').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    // Handle delete selected
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async function() {
            const selectedIds = Array.from(document.querySelectorAll('.member-select:checked'))
                .map(checkbox => checkbox.dataset.id);

            if (selectedIds.length === 0) {
                alert('Please select members to delete');
                return;
            }

            if (confirm(`Are you sure you want to delete ${selectedIds.length} member(s)?`)) {
                try {
                    const response = await fetch('/admin/members/bulk-delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ids: selectedIds })
                    });

                    const result = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(result.error || 'Failed to delete members');
                    }

                    selectedIds.forEach(id => {
                        const row = document.querySelector(`.member-select[data-id="${id}"]`).closest('.table-row');
                        row.remove();
                    });
                    alert('Selected members deleted successfully!');
                } catch (error) {
                    console.error('Error deleting members:', error);
                    alert('Error deleting members: ' + error.message);
                }
            }
        });
    }

    // Close profile modal
    if (profileCloseBtn) {
        profileCloseBtn.addEventListener('click', function() {
            closeModal(profileModal);
        });
    }
}); 