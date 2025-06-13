// js-files/admin.js
document.addEventListener('DOMContentLoaded', function() {
    const adminToggle = document.getElementById('admin-toggle');
    const adminLink = document.querySelector('.admin-link');

    // Check admin status
    function checkAdminStatus() {
        const isAdmin = localStorage.getItem('shopAdmin') === 'true';
        if (isAdmin && adminToggle) {
            adminToggle.style.display = 'block';
            if (adminLink) adminLink.style.display = 'block';
        }
    }

    // Toggle admin mode
    if (adminToggle) {
        adminToggle.addEventListener('click', () => {
            const isAdminMode = document.body.classList.toggle('admin-mode');
            
            document.querySelectorAll('.admin-controls').forEach(control => {
                control.style.display = isAdminMode ? 'block' : 'none';
            });
            
            adminToggle.innerHTML = isAdminMode ? 
                '<i class="bx bx-cog"></i> Exit Admin Mode' : 
                '<i class="bx bx-cog"></i> Admin Mode';
        });
    }

    // Initialize
    checkAdminStatus();
});