document.addEventListener('DOMContentLoaded', function() {
    // Package selection
    const packageCards = document.querySelectorAll('.package-card');
    const selectedPackageInput = document.getElementById('selectedPackage');

    packageCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            packageCards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            this.classList.add('selected');
            // Update hidden input value
            selectedPackageInput.value = this.dataset.packageId;
        });
    });

    // Form validation
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if a package is selected
            if (!selectedPackageInput.value) {
                alert('Please select a package before proceeding.');
                return;
            }

            // If all validations pass, submit the form
            this.submit();
        });
    }

    // Date input min date setting
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Time input validation
    const timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.addEventListener('change', function() {
            const time = this.value;
            const hour = parseInt(time.split(':')[0]);
            
            // Assuming gym hours are 6 AM to 10 PM
            if (hour < 6 || hour >= 22) {
                alert('Please select a time between 6:00 AM and 10:00 PM');
                this.value = '';
            }
        });
    }
}); 