// Function to display user data from sessionStorage
function displayUserData() {
    // Get user data from the embedded server variable
    const userData = serverUserData; // Use the data embedded in the EJS template
    
    if (userData) {
        // Update user information in the dashboard
        document.getElementById('userName').textContent = userData.fullName || 'Guest User';
        document.getElementById('membershipType').textContent = userData.membership?.tier || 'No Membership';
        // Check if startDate is available before using toLocaleDateString
        const memberSinceDate = userData.membership?.startDate ? new Date(userData.membership.startDate).toLocaleDateString() : 'N/A';
        document.getElementById('memberSince').textContent = `Member since: ${memberSinceDate}`;
        
        // Update membership details
        document.getElementById('membershipPlan').textContent = userData.membership?.plan || 'N/A';
        document.getElementById('membershipStatus').textContent = userData.membership?.status || 'N/A';
        document.getElementById('nextPayment').textContent = userData.membership?.nextPayment || 'N/A';
        document.getElementById('expiryDate').textContent = userData.membership?.renewal || 'N/A';
        
        // Update stats - Use the correct property names based on newUser object in app.js
        document.getElementById('classesAttended').textContent = userData.stats?.classesAttended || '0';
        document.getElementById('hoursWorked').textContent = userData.stats?.hoursWorked || '0';
        document.getElementById('achievementsEarned').textContent = userData.stats?.achievementsEarned || '0';
        document.getElementById('daysStreak').textContent = userData.stats?.daysStreak || '0';
        
        // Update upcoming classes
        const upcomingClassesContainer = document.getElementById('upcomingClasses');
        if (userData.upcomingClasses && userData.upcomingClasses.length > 0) {
            upcomingClassesContainer.innerHTML = userData.upcomingClasses.map(classItem => `
                <div class="class-item">
                    <h4>${classItem.name}</h4>
                    <p>${classItem.time} with ${classItem.trainer}</p>
                </div>
            `).join('');
        } else {
            upcomingClassesContainer.innerHTML = '<p class="empty-state">No upcoming classes scheduled</p>';
        }
    } else {
        // Handle case when no user data is found (should not happen if redirected from server with data)
        document.getElementById('userName').textContent = 'Error loading user data';
        document.getElementById('membershipType').textContent = 'N/A';
        document.getElementById('memberSince').textContent = 'N/A';
        // Optionally redirect to login or home page if no user data is found
        // window.location.href = '/';
    }
}

// Function to handle profile editing
function editProfile() {
    // Implement profile editing functionality
    window.location.href = '/edit-profile';
}

// Load user data when the page loads
document.addEventListener('DOMContentLoaded', displayUserData); 