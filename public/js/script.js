// User database for testing
const users = {
    "amr": {
        password: "amr123",
        fullName: "Amr Mohamed",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        membership: {
            tier: "Premium Member",
            plan: "Premium Plus",
            startDate: "May 15, 2023",
            renewal: "Monthly",
            nextPayment: "June 15, 2023",
            status: "active"
        },
        stats: {
            workouts: 24,
            weeks: 8,
            attendance: 87,
            progress: 75,
            weightChange: "-5.2kg",
            muscleGain: "+3.1%",
            fatLoss: "-4.5%"
        },
        classes: [
            { time: "10:00 AM", name: "HIIT Training", trainer: "Sarah" },
            { time: "05:30 PM", name: "Yoga Flow", trainer: "Mike" },
            { time: "07:00 PM", name: "Boxing", trainer: "Alex" }
        ]
    },
    "john": {
        password: "john123",
        fullName: "John Doe",
        avatar: "https://randomuser.me/api/portraits/men/44.jpg",
        membership: {
            tier: "Basic Member",
            plan: "Starter Plan",
            startDate: "April 1, 2023",
            renewal: "Monthly",
            nextPayment: "June 1, 2023",
            status: "active"
        },
        stats: {
            workouts: 12,
            weeks: 4,
            attendance: 65,
            progress: 45,
            weightChange: "-2.1kg",
            muscleGain: "+1.5%",
            fatLoss: "-2.8%"
        },
        classes: [
            { time: "09:00 AM", name: "Cardio Blast", trainer: "Emma" },
            { time: "06:00 PM", name: "Strength Training", trainer: "David" }
        ]
    },
    "sara": {
        password: "sara123",
        fullName: "Sara Johnson",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
        membership: {
            tier: "Elite Member",
            plan: "Ultimate Package",
            startDate: "March 10, 2023",
            renewal: "Yearly",
            nextPayment: "March 10, 2024",
            status: "active"
        },
        stats: {
            workouts: 36,
            weeks: 12,
            attendance: 92,
            progress: 88,
            weightChange: "-7.5kg",
            muscleGain: "+5.2%",
            fatLoss: "-6.3%"
        },
        classes: [
            { time: "07:30 AM", name: "Pilates", trainer: "Lisa" },
            { time: "12:00 PM", name: "Zumba", trainer: "Carlos" },
            { time: "05:00 PM", name: "CrossFit", trainer: "Tom" }
        ]
    }
};

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // Add a slight delay before adding the show class for transition
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        // Wait for the transition to finish before hiding the modal
        modal.addEventListener('transitionend', function handler() {
            modal.style.display = 'none';
            modal.removeEventListener('transitionend', handler);
        });
    }
}

window.onclick = function(event) {
    // Close login modal if clicking outside
    const loginModal = document.getElementById("login-modal");
    if (event.target === loginModal) {
        closeModal('login-modal');
    }
    // Close signup modal if clicking outside
    const signupModal = document.getElementById("signup-modal");
     if (event.target === signupModal) {
        closeModal('signup-modal');
    }
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    // Removed old switchToSignupLink and switchToLoginLink as they use onclick attribute
    const showLoginBtn = document.getElementById('show-login-btn');
    const closeButtons = document.querySelectorAll('.modal .close-btn'); // Select all close buttons within modals
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const signupServerError = document.getElementById('signup-server-error'); // Get the server error div
    
    // New links for switching between modals
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');
    const loginServerError = document.getElementById('login-server-error'); // Get the login server error div

    // Handle login form submission via AJAX
    if (loginForm && loginServerError) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent default form submission

            loginServerError.textContent = ''; // Clear previous errors

            const formData = new FormData(loginForm); // Get form data
            const jsonData = {};
            formData.forEach((value, key) => {
                jsonData[key] = value;
            });

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonData),
                    credentials: 'include' // Important: include credentials for session cookies
                });

                const result = await response.json();

                if (result.success) {
                    // Store minimal user info in sessionStorage
                    sessionStorage.setItem('loggedInUser', result.username);
                    sessionStorage.setItem('userData', JSON.stringify({
                        username: result.username,
                        fullName: result.fullName
                    }));
                    // Redirect on success
                    window.location.href = result.redirect || '/user';
                } else {
                    // Display server error message
                    loginServerError.textContent = result.message || 'An unknown error occurred.';
                }
            } catch (error) {
                console.error('Error during login submission:', error);
                loginServerError.textContent = 'An error occurred during login. Please try again.';
            }
        });
    }

    // Handle signup form submission via AJAX
    if (signupForm && signupServerError) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent default form submission

            signupServerError.textContent = ''; // Clear previous errors

            const formData = new FormData(signupForm); // Get form data
            const jsonData = {};
            formData.forEach((value, key) => {
                jsonData[key] = value;
            });

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonData)
                });

                const result = await response.json();

                if (result.success) {
                    // Redirect on success
                    window.location.href = result.redirect || '/user';
                } else {
                    // Display server error message
                    signupServerError.textContent = result.message || 'An unknown error occurred.';
                }
            } catch (error) {
                console.error('Error during signup submission:', error);
                signupServerError.textContent = 'An error occurred during signup. Please try again.';
            }
        });
    }

    // Check login status on page load
    checkLoggedIn();
    
    // Add event listener for the 'My Account' link
    const accountLink = document.querySelector('a[href="/user"]');
    if (accountLink) {
        accountLink.addEventListener('click', function(e) {
            // Check if the user is logged in
            const loggedInUser = sessionStorage.getItem('loggedInUser');
            if (!loggedInUser) {
                // If not logged in, prevent default navigation and open modal
                e.preventDefault();
                openModal('login-modal');
            }
        });
        
    }
    
    // Add logout button listener if it exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add show login button listener
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(){
            openModal('login-modal');
        });
    }
    
    // Add close button listeners
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function(){
            const modal = btn.closest('.modal'); // Find the parent modal
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Add event listeners for switching between modals
    if (showSignupLink && loginModal && signupModal) {
        showSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('login-modal');
            openModal('signup-modal');
        });
    }

    if (showLoginLink && loginModal && signupModal) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('signup-modal');
            openModal('login-modal');
        });
    }

    // Add event listener for the footer signup button to mimic login then signup
    const footerSignupBtn = document.getElementById('footer-signup-btn');
    if (footerSignupBtn && loginModal && signupModal) {
        footerSignupBtn.addEventListener('click', function() {
            // Open login modal, then switch to signup modal
            openModal('login-modal');
            setTimeout(function() {
                closeModal('login-modal');
                openModal('signup-modal');
            }, 300); // Delay to allow login modal to open before switching
        });
    }
});

// Check if user is already logged in
function checkLoggedIn() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    // Get common elements that exist on all pages
    const loginModal = document.getElementById('login-modal');
    const logoutBtn = document.getElementById('logout-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const accountLink = document.querySelector('a[href="user.html"]');
    
    if (loggedInUser && userData) {
        // Hide login modal and show logout button on all pages
        if (loginModal) loginModal.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (showLoginBtn) showLoginBtn.style.display = 'none';
        
        // Update account link to show user's name
        if (accountLink) {
            accountLink.textContent = userData.fullName ? userData.fullName.split(' ')[0] : 'My Account';
        }
        
        // If we're on user.html, show the dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            loadUserData(loggedInUser);
        }
        
        // If we're on admin.html, show admin dashboard
        if (window.location.pathname.includes('admin.html')) {
            // Add admin dashboard display logic here
        }
    } else {
        // If not logged in and on user.html, redirect to home
        if (window.location.pathname.includes('user.html')) {
            window.location.href = "home.html";
        }
        // Show login button and hide logout button on all pages
        if (showLoginBtn) showLoginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (accountLink) {
            accountLink.textContent = 'My Account';
        }
    }
}

// Logout function
function logout() {
    // Clear client-side storage
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('userData');
    
    // Call server logout endpoint
    fetch('/logout', {
        method: 'GET',
        credentials: 'include'
    }).finally(() => {
        window.location.href = "/"; // Redirect to home page after logout
    });
}

const accounts = {
    admin: { username: "admin", password: "admin123", role: "admin" },
    user: { username: "user", password: "user123", role: "user" }
};

// Sample users for demo
const logins = JSON.parse(localStorage.getItem("loginLog")) || [];

const loginLogEl = document.getElementById("login-log");

const userListEl = document.getElementById("user-list");
const userCountEl = document.getElementById("user-count");
const paidCountEl = document.getElementById("paid-count");
const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");

function renderLogins() {
    loginLogEl.innerHTML = logins.map(item => `<li>${item.user} logged in at ${item.time}</li>`).join("");
}

function renderUsers() {
    userListEl.innerHTML = Object.values(users).map((user, index) => `
        <li>
            ${user.fullName} - ${user.membership.status === "active" ? "✅ Subscribed" : "❌ Not Subscribed"}
            <button onclick="toggleSubscribe(${index})">Subscribe</button>
        </li>`).join("");

    userCountEl.textContent = Object.keys(users).length;
    paidCountEl.textContent = Object.values(users).filter(u => u.membership.status === "active").length;
}

function toggleSubscribe(index) {
    const user = Object.values(users)[index];
    user.membership.status = user.membership.status === "active" ? "inactive" : "active";
    renderUsers();
}

// Initial render
renderLogins();
renderUsers();

// Fade-out effect for page transitions
document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('page-transition');
    if (!page) return; // Exit if the page-transition element is not found

    const links = document.querySelectorAll('a[href]');
    const transitionDuration = parseFloat(getComputedStyle(page).transitionDuration) * 1000 || 600;

    links.forEach(link => {
        const target = link.getAttribute('href');

        // Avoid applying fade-out to modal buttons, external links, or JavaScript-based links
        if (!target.startsWith('#') && !target.startsWith('javascript:') && !target.startsWith('http')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Add fade-out class to trigger the CSS transition
                page.classList.add('fade-out');

                // Navigate to the target page after the transition ends
                setTimeout(() => {
                    window.location.href = target;
                }, transitionDuration);
            });
        }
    });
});

const classDetails = {
    yoga: {
        title: "Yoga",
        image: "yoga-class.jpg",
        description: "Our yoga classes are designed to help you relax, stretch, and strengthen your body. Suitable for all levels, from beginners to advanced practitioners.",
        coach: "Emily Smith",
        schedule: "Monday, Wednesday, Friday at 7:00 AM and 6:00 PM"
    },
    pilates: {
        title: "Pilates",
        image: "pilates-class.jpg",
        description: "Pilates focuses on core strength, flexibility, and overall body awareness. Suitable for all fitness levels.",
        coach: "Sarah Lee",
        schedule: "Tuesday, Thursday at 9:00 AM and 6:00 PM"
    },
    hiit: {
        title: "HIIT",
        image: "hiit-class.jpg",
        description: "High-intensity interval training (HIIT) is perfect for burning fat and improving cardiovascular health. Each session is 45 minutes of intense, calorie-burning workouts.",
        coach: "John Doe",
        schedule: "Tuesday, Thursday at 7:00 AM and 5:00 PM"
    },
    cycling: {
        title: "Cycling",
        image: "cycling-class.jpg",
        description: "Cardio workout on stationary bikes. Great for improving endurance and burning calories.",
        coach: "Chris Brown",
        schedule: "Monday, Wednesday, Friday at 6:00 AM and 5:00 PM"
    },
    strength: {
        title: "Strength Training",
        image: "strength-class.jpg",
        description: "Build muscle and increase strength with our expert-led strength training sessions. We focus on proper form and technique to maximize results.",
        coach: "Mike Johnson",
        schedule: "Monday, Wednesday, Friday at 8:00 AM and 7:00 PM"
    },
    boxing: {
        title: "Boxing",
        image: "boxing-class.jpg",
        description: "Improve agility, strength, and endurance with our boxing classes. No prior experience required.",
        coach: "Alex Green",
        schedule: "Tuesday, Thursday at 8:00 AM and 7:00 PM"
    }
};

// Call loadUserData when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
});

// Modal open/close logic
// This ensures the login modal works on all pages with the correct IDs/classes

document.addEventListener('DOMContentLoaded', function() {
    const loginModal = document.getElementById('login-modal');
    const showLoginBtn = document.getElementById('show-login-btn');
    const closeBtn = document.querySelector('.modal .close-btn');

    if (showLoginBtn && loginModal) {
        showLoginBtn.onclick = function() {
            loginModal.style.display = 'flex';
        };
    }
    if (closeBtn && loginModal) {
        closeBtn.onclick = function() {
            loginModal.style.display = 'none';
        };
    }
    window.onclick = function(event) {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
        }
    };
});

function loadUserData() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) return;

    // Update dashboard header
    const userName = document.getElementById('user-name');
    const userMembership = document.getElementById('user-membership');
    if (userName) userName.textContent = userData.fullName;
    if (userMembership) userMembership.textContent = userData.membership.tier;

    // Update profile card
    const userAvatar = document.getElementById('user-avatar');
    const userFullname = document.getElementById('user-fullname');
    const userTier = document.getElementById('user-tier');
    if (userAvatar) userAvatar.src = userData.avatar;
    if (userFullname) userFullname.textContent = userData.fullName;
    if (userTier) userTier.textContent = userData.membership.tier;

    // Update stats
    const workoutsCount = document.getElementById('workouts-count');
    const weeksActive = document.getElementById('weeks-active');
    const attendanceRate = document.getElementById('attendance-rate');
    if (workoutsCount) workoutsCount.textContent = userData.stats.workouts;
    if (weeksActive) weeksActive.textContent = userData.stats.weeks;
    if (attendanceRate) attendanceRate.textContent = userData.stats.attendance + '%';

    // Update progress
    const weightChange = document.getElementById('weight-change');
    const muscleGain = document.getElementById('muscle-gain');
    const fatLoss = document.getElementById('fat-loss');
    const progressFill = document.getElementById('progress-fill');
    if (weightChange) weightChange.textContent = userData.stats.weightChange;
    if (muscleGain) muscleGain.textContent = userData.stats.muscleGain;
    if (fatLoss) fatLoss.textContent = userData.stats.fatLoss;
    if (progressFill) progressFill.style.width = userData.stats.progress + '%';

    // Update upcoming classes
    const upcomingClasses = document.getElementById('upcoming-classes');
    if (upcomingClasses) {
        upcomingClasses.innerHTML = userData.classes.map(cls => `
            <div class="class-item">
                <div class="class-time">${cls.time}</div>
                <div class="class-info">
                    <h4>${cls.name}</h4>
                    <p>with ${cls.trainer}</p>
                </div>
            </div>
        `).join('');
    }
}
  
