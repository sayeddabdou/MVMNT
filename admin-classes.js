document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const classSearch = document.getElementById('class-search');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const addClassBtn = document.getElementById('add-class-btn');
    const classModal = document.getElementById('class-modal');
    const classForm = document.getElementById('class-form');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = classModal.querySelector('.close-btn');

    // Filter functionality
    function filterClasses() {
        const searchTerm = classSearch.value.toLowerCase();
        const categoryValue = categoryFilter.value;
        const statusValue = statusFilter.value;
        const rows = document.querySelectorAll('#classes-table tr');

        rows.forEach(row => {
            const name = row.cells[0]?.textContent.toLowerCase() || '';
            const coach = row.cells[1]?.textContent.toLowerCase() || '';
            const category = row.cells[2]?.textContent.trim() || '';
            const status = row.cells[5]?.querySelector('.status-badge')?.textContent.trim() || '';

            const matchesSearch = name.includes(searchTerm) || 
                                coach.includes(searchTerm) || 
                                category.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryValue === '' || category.toLowerCase() === categoryValue.toLowerCase();
            const matchesStatus = statusValue === '' || status.toLowerCase() === statusValue.toLowerCase();

            row.style.display = matchesSearch && matchesCategory && matchesStatus ? '' : 'none';
        });
    }

    // Event listeners for filters
    if (classSearch) classSearch.addEventListener('input', filterClasses);
    if (categoryFilter) categoryFilter.addEventListener('change', filterClasses);
    if (statusFilter) statusFilter.addEventListener('change', filterClasses);

    // Modal handling
    function openModal(mode = 'add', classData = null) {
        modalTitle.textContent = mode === 'add' ? 'Add New Class' : 'Edit Class';
        if (classData) {
            document.getElementById('class-name').value = classData.name;
            document.getElementById('class-coach').value = classData.coach;
            document.getElementById('class-category').value = classData.category;
            document.getElementById('class-schedule').value = classData.schedule;
            document.getElementById('class-capacity').value = classData.capacity;
            document.getElementById('class-description').value = classData.description || '';
            document.getElementById('class-status').value = classData.status;
        } else {
            classForm.reset();
        }
        classModal.style.display = 'flex';
        classModal.classList.add('show');
    }

    function closeModal() {
        classModal.style.display = 'none';
        classModal.classList.remove('show');
        classForm.reset();
    }

    // Event listeners for modal
    if (addClassBtn) addClassBtn.addEventListener('click', () => openModal('add'));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === classModal) closeModal();
    });

    // Handle form submission
    if (classForm) {
        classForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                name: document.getElementById('class-name').value,
                coach: document.getElementById('class-coach').value,
                category: document.getElementById('class-category').value,
                schedule: document.getElementById('class-schedule').value,
                capacity: document.getElementById('class-capacity').value,
                description: document.getElementById('class-description').value,
                status: document.getElementById('class-status').value
            };

            try {
                const response = await fetch('/admin/classes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to save class');
                }

                alert('Class saved successfully!');
                closeModal();
                // Reload the page to show updated data
                location.reload();
            } catch (error) {
                console.error('Error saving class:', error);
                alert('Error saving class: ' + error.message);
            }
        });
    }

    // Handle action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const classId = this.dataset.id;
            const classData = {
                id: classId,
                name: row.cells[0].textContent,
                coach: row.cells[1].textContent,
                category: row.cells[2].textContent,
                schedule: row.cells[3].textContent,
                enrolled: parseInt(row.cells[4].textContent.split('/')[0]),
                capacity: parseInt(row.cells[4].textContent.split('/')[1]),
                status: row.cells[5].querySelector('.status-badge').textContent.trim()
            };

            if (this.classList.contains('view-btn')) {
                // Show class details in a formatted alert
                const details = `
Class Details:
--------------
Name: ${classData.name}
Coach: ${classData.coach}
Category: ${classData.category}
Schedule: ${classData.schedule}
Enrollment: ${classData.enrolled}/${classData.capacity}
Status: ${classData.status}
                `.trim();
                alert(details);
            } 
            else if (this.classList.contains('edit-btn')) {
                openModal('edit', classData);
            }
            else if (this.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this class?')) {
                    try {
                        const response = await fetch(`/admin/classes/${classId}`, {
                            method: 'DELETE'
                        });

                        const result = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(result.error || 'Failed to delete class');
                        }

                        row.remove();
                        alert('Class deleted successfully!');
                    } catch (error) {
                        console.error('Error deleting class:', error);
                        alert('Error deleting class: ' + error.message);
                    }
                }
            }
        });
    });
}); 