// Booking functionality
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const classSelect = document.getElementById('class-select');
    const trainerSelect = document.getElementById('trainer-select');
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');
    const submitBtn = document.getElementById('submit-booking');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Handle form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const bookingData = {
                class: classSelect.value,
                trainer: trainerSelect.value,
                date: dateInput.value,
                time: timeInput.value,
                status: 'pending'
            };

            // Save booking to localStorage
            const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            bookings.push({
                ...bookingData,
                id: Date.now(),
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('bookings', JSON.stringify(bookings));

            // Show success message
            showNotification('Booking submitted successfully!', 'success');
            
            // Reset form
            bookingForm.reset();
        });
    }

    // Handle class selection
    if (classSelect) {
        classSelect.addEventListener('change', function() {
            const selectedClass = this.value;
            // Update available trainers based on class
            updateTrainers(selectedClass);
        });
    }

    // Update available trainers based on selected class
    function updateTrainers(selectedClass) {
        const trainers = {
            'yoga': ['Emily Smith', 'Sarah Lee'],
            'hiit': ['John Doe', 'Alex Green'],
            'calisthenics': ['Ryan Clark'],
            'pilates': ['Sarah Lee'],
            'boxing': ['Alex Green'],
            'cycling': ['Chris Brown']
        };

        if (trainerSelect) {
            trainerSelect.innerHTML = '<option value="">Select Trainer</option>';
            if (selectedClass && trainers[selectedClass]) {
                trainers[selectedClass].forEach(trainer => {
                    trainerSelect.innerHTML += `<option value="${trainer}">${trainer}</option>`;
                });
            }
        }
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}); 