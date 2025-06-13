const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const mongoose = require('mongoose');
const ClassModel = require('./models/Class');
const Booking = require('./models/Booking');
const Payment = require('./models/payment');
const orderRoutes = require('./routes/orders');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const multer = require('multer');
const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('=== Request Debug ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body);
    console.log('===================');
    next();
});

// Body parser middleware - Add this before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const mongoURI = 'mongodb+srv://database:database123@cluster0.u6ry3ky.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

// Add mongoose debug mode
mongoose.set('debug', true);

// MongoDB connection with detailed logging
mongoose.connect(mongoURI, {
    dbName: 'test' // Explicitly set database name
})
.then(() => {
    console.log('=== MongoDB Connection Success ===');
    console.log('Connected to MongoDB successfully');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
})
.catch(err => {
    console.error('=== MongoDB Connection Error ===');
    console.error('Error details:', err);
    console.error('Connection string:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    process.exit(1); // Exit the application if MongoDB connection fails
});

// Add connection error handler
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

// Add connection success handler
mongoose.connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
});

// Import models
const Class = require('./models/Class');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, // set to true if using https
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true
    }
}));

// Middleware to set shop layout for shop-related pages
app.use((req, res, next) => {
    const shopPages = ['/shop', '/all-products', '/equipment', '/supplements', '/on-sale'];
    if (shopPages.includes(req.path)) {
        res.locals.layout = 'layouts/shop';
    }
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Sample data (in a real app, this would come from a database)
const features = [
    {
        title: "Premium Locations",
        description: "Discover our state-of-the-art facilities in Cairo and Giza\\'s most prominent areas.",
        image: "Our Locations.jpg",
        link: "/locations",
        linkText: "View Locations"
    },
    {
        title: "Expert Coaches",
        description: "Train with our certified professionals who create personalized plans.",
        image: "Our Team.jpg",
        link: "/our-team",
        linkText: "Meet The Team"
    },
    {
        title: "Diverse Classes",
        description: "From high-intensity HIIT to mindful Yoga, we offer classes for all fitness levels.",
        image: "Our Classes.jpg",
        link: "/classes",
        linkText: "Browse Classes"
    }
];

const timeline = [
    {
        year: "2017",
        title: "The Beginning",
        description: "Founded with inspiration from Olympic champion Lazar Angelov."
    },
    {
        year: "2019",
        title: "First Expansion",
        description: "Opened second location in Uptown Cairo with expanded facilities."
    },
    {
        year: "2020",
        title: "Elite Training Program",
        description: "Launched signature training methodology."
    },
    {
        year: "2023",
        title: "Current Era",
        description: "Operating 4 premium locations with 15+ expert coaches."
    }
];

const stats = [
    { number: "6+", label: "Years Experience" },
    { number: "4", label: "Premium Locations" },
    { number: "15+", label: "Expert Coaches" },
    { number: "24", label: "Weekly Classes" }
];

const transformations = [
    {
        beforeImage: "before1.jpg",
        afterImage: "after1.jpeg",
        quote: "Lost 22kg in 6 months with MVMNT\\'s personalized training and nutrition plan. Never felt better!",
        name: "- Ahmed R., 32"
    },
    {
        beforeImage: "before2.jpg",
        afterImage: "after2.jpg",
        quote: "Gained 12kg of muscle in 8 months through dedicated strength training. The coaches are phenomenal.",
        name: "- Chris Anderson, 31"
    }
];

// Sample data for classes
const classData = {
    stats: {
        totalClasses: 24,
        activeClasses: 20,
        totalEnrollments: 150,
        mostPopularCategory: 'HIIT'
    },
    coaches: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Sarah Lee' },
        { id: 3, name: 'Alex Green' },
        { id: 4, name: 'Ryan Clark' },
        { id: 5, name: 'Chris Brown' }
    ],
    categories: ['Yoga', 'HIIT', 'Calisthenics', 'Pilates', 'Boxing', 'Cycling'],
    locations: [
        { id: 1, name: 'Main Branch' },
        { id: 2, name: 'Downtown' },
        { id: 3, name: 'Uptown' }
    ]
};

// Sample data for shop
const shopData = {
    products: [
        {
            id: 1,
            name: 'Protein Powder',
            price: 49.99,
            category: 'Supplements',
            image: 'protein-powder.jpg'
        },
        // Add more products as needed
    ],
    categories: ['Supplements', 'Equipment', 'Clothing', 'Accessories']
};

// Authentication middleware for admin routes
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.loggedInUser || !req.session.userData || req.session.userData.role !== 'admin') {
        console.log('Admin access denied:', {
            hasSession: !!req.session,
            loggedInUser: req.session?.loggedInUser,
            userRole: req.session?.userData?.role
        });
        return res.redirect('/?error=Admin access required');
    }
    next();
};

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Check if it's admin login (keep this for now, though AJAX might change how this is handled client-side)
    if (username === 'admin' && password === 'admin123') {
        req.session.loggedInUser = username;
        req.session.userData = { role: 'admin' };
        return req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Session error during admin login.' });
            }
            return res.json({ 
                success: true, 
                redirect: '/admin',
                username: username,
                fullName: 'Administrator'
            });
        });
    }
    
    try {
        // Find user in the database by username first
        const user = await User.findOne({ username: username });

        // If user not found
        if (!user) {
            console.log('Login failed: User not found for username:', username);
            return res.status(400).json({ success: false, message: 'Invalid credentials. Try again.' });
        }

        // Compare passwords (Note: Plain text comparison, hash passwords in a real app!)
        if (user.password !== password) {
            console.log('Login failed: Incorrect password for username:', username);
            return res.status(400).json({ success: false, message: 'Invalid credentials. Try again.' });
        }

        // Login successful
        req.session.loggedInUser = user.username;
        req.session.userData = user;
        
        return req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Session error during login.' });
            }
            console.log('Login successful for user:', username);
            return res.json({ 
                success: true, 
                redirect: '/user',
                username: user.username,
                fullName: user.fullName || user.username
            });
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Routes
// Main pages
app.get('/', (req, res) => {
    res.render('home', {
        title: 'Home',
        currentPage: 'home',
        features,
        timeline,
        stats,
        transformations
    });
});

app.get('/locations', (req, res) => {
    res.render('locations', {
        title: 'Our Locations',
        currentPage: 'locations'
    });
});

app.get('/our-team', (req, res) => {
    res.render('our-team', {
        title: 'Our Team',
        currentPage: 'our-team'
    });
});

app.get('/membership', (req, res) => {
    res.render('membership', {
        title: 'Membership',
        currentPage: 'membership'
    });
});

app.get('/classes', (req, res) => {
    res.render('classes', {
        title: 'Classes',
        currentPage: 'classes',
        classData: {
            stats: {
                totalClasses: 24,
                activeClasses: 20,
                totalEnrollments: 150,
                mostPopularCategory: 'HIIT'
            },
            coaches: [
                { id: 1, name: 'John Doe' },
                { id: 2, name: 'Sarah Lee' },
                { id: 3, name: 'Alex Green' },
                { id: 4, name: 'Ryan Clark' },
                { id: 5, name: 'Chris Brown' }
            ],
            categories: ['Yoga', 'HIIT', 'Calisthenics', 'Pilates', 'Boxing', 'Cycling'],
            locations: [
                { id: 1, name: 'Main Branch' },
                { id: 2, name: 'Downtown' },
                { id: 3, name: 'Uptown' }
            ],
            statusTypes: ['Active', 'Inactive', 'Cancelled', 'Completed'],
            recurringTypes: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' }
            ],
            availableMembers: [
                { id: 1, name: 'John Smith', membership: 'Premium' },
                { id: 2, name: 'Jane Doe', membership: 'Standard' },
                { id: 3, name: 'Alex Green', membership: 'Premium' }
            ]
        }
    });
});

// Booking routes
app.get('/booking', (req, res) => {
    res.render('booking', {
        title: 'Book a Class',
        currentPage: 'booking',
        coaches: classData.coaches,
        categories: classData.categories
    });
});

// Route for HIIT class booking page
app.get('/booking-class/hiit', (req, res) => {
    console.log('Rendering HIIT booking page');
    const classData = {
        id: 'hiit',
        name: 'HIIT',
        type: 'High Intensity Training',
        difficulty: 'Advanced Level',
        calories: '500',
        duration: '45',
        location: 'Main Studio',
        capacity: '20',
        image: 'HIIT.jpg',
        description: 'High-intensity interval training (HIIT) is perfect for burning fat and improving cardiovascular health. Each session is 45 minutes of intense, calorie-burning workouts.',
        benefits: [
            'Increased metabolism and fat burning',
            'Improved cardiovascular endurance',
            'Enhanced strength and power',
            'Time-efficient workout',
            'Continued calorie burn after workout'
        ],
        trainers: [
            {
                name: 'John Doe',
                role: 'Lead HIIT Instructor',
                image: 'coach-john.jpg'
            },
            {
                name: 'Alex Green',
                role: 'HIIT Specialist',
                image: 'coach-alex.jpg'
            }
        ]
    };

    res.render('booking-hiit', {
        title: 'Book HIIT Class',
        currentPage: 'booking',
        classData: classData
    });
});

// Route for Yoga class booking page
app.get('/booking-class/yoga', (req, res) => {
    console.log('Rendering Yoga booking page');
    const classData = {
        id: 'yoga',
        name: 'Yoga',
        type: 'Mind-Body Practice',
        difficulty: 'All Levels',
        calories: '300',
        duration: '60',
        location: 'Yoga Studio',
        capacity: '15',
        image: 'yoga.jpg',
        description: 'Our yoga classes combine physical postures, breathing techniques, and meditation to promote physical and mental well-being. Perfect for all fitness levels.',
        benefits: [
            'Improved flexibility and balance',
            'Reduced stress and anxiety',
            'Better posture and core strength',
            'Enhanced mental clarity',
            'Increased body awareness'
        ],
        trainers: [
            {
                name: 'Sarah Lee',
                role: 'Lead Yoga Instructor',
                image: 'coach-sarah.jpg'
            },
            {
                name: 'Laura White',
                role: 'Yoga Specialist',
                image: 'coach-laura.jpg'
            }
        ]
    };

    res.render('booking-yoga', {
        title: 'Book Yoga Class',
        currentPage: 'booking',
        classData: classData
    });
});

// Route for Calisthenics class booking page
app.get('/booking-class/calisthenics', (req, res) => {
    console.log('Rendering Calisthenics booking page');
    const classData = {
        id: 'calisthenics',
        name: 'Calisthenics',
        type: 'Bodyweight Training',
        difficulty: 'Intermediate',
        calories: '400',
        duration: '45',
        location: 'Main Studio',
        capacity: '20',
        image: 'calisthenics.jpg',
        description: 'Master your body weight with our calisthenics classes. Learn fundamental movements like push-ups, pull-ups, and dips while building strength and control.',
        benefits: [
            'Improved body control and coordination',
            'Increased relative strength',
            'Better muscle definition',
            'Enhanced mobility and flexibility',
            'No equipment needed for home practice'
        ],
        trainers: [
            {
                name: 'Alex Green',
                role: 'Lead Calisthenics Coach',
                image: 'coach-alex.jpg'
            },
            {
                name: 'Ryan Clark',
                role: 'Calisthenics Specialist',
                image: 'coach-ryan.jpg'
            }
        ]
    };

    res.render('booking-calisthenics', {
        title: 'Book Calisthenics Class',
        currentPage: 'booking',
        classData: classData
    });
});

// Route for Pilates class booking page
app.get('/booking-class/pilates', (req, res) => {
    console.log('Rendering Pilates booking page');
    const classData = {
        id: 'pilates',
        name: 'Pilates',
        type: 'Core & Flexibility',
        difficulty: 'All Levels',
        calories: '250',
        duration: '50',
        location: 'Pilates Studio',
        capacity: '12',
        image: 'pilates.jpg',
        description: 'Our Pilates classes focus on core strength, flexibility, and body awareness. Perfect for improving posture and overall body control.',
        benefits: [
            'Stronger core muscles',
            'Improved posture and alignment',
            'Enhanced body awareness',
            'Better flexibility and mobility',
            'Reduced back pain'
        ],
        trainers: [
            {
                name: 'Emily Smith',
                role: 'Lead Pilates Instructor',
                image: 'coach-emily.jpg'
            },
            {
                name: 'Laura White',
                role: 'Pilates Specialist',
                image: 'coach-laura.jpg'
            }
        ]
    };

    res.render('booking-pilates', {
        title: 'Book Pilates Class',
        currentPage: 'booking',
        classData: classData
    });
});

// Route for Boxing class booking page
app.get('/booking-class/boxing', (req, res) => {
    console.log('Rendering Boxing booking page');
    const classData = {
        id: 'boxing',
        name: 'Boxing',
        type: 'Combat & Cardio',
        difficulty: 'Intermediate',
        calories: '600',
        duration: '45',
        location: 'Boxing Ring',
        capacity: '15',
        image: 'boxing.jpg',
        description: 'Learn boxing fundamentals while getting an intense cardio workout. Our boxing classes combine technique training with high-energy conditioning.',
        benefits: [
            'Improved cardiovascular fitness',
            'Enhanced coordination and reflexes',
            'Full-body workout',
            'Stress relief and confidence building',
            'Self-defense skills'
        ],
        trainers: [
            {
                name: 'John Doe',
                role: 'Lead Boxing Coach',
                image: 'coach-john.jpg'
            },
            {
                name: 'Ryan Clark',
                role: 'Boxing Specialist',
                image: 'coach-ryan.jpg'
            }
        ]
    };

    res.render('booking-boxing', {
        title: 'Book Boxing Class',
        currentPage: 'booking',
        classData: classData
    });
});

// Route for Cycling class booking page
app.get('/booking-class/cycling', (req, res) => {
    console.log('Rendering Cycling booking page');
    const classData = {
        id: 'cycling',
        name: 'Cycling',
        type: 'Cardio & Endurance',
        difficulty: 'All Levels',
        calories: '500',
        duration: '45',
        location: 'Cycling Studio',
        capacity: '25',
        image: 'cycling.jpg',
        description: 'Our indoor cycling classes provide an intense cardio workout while being easy on the joints. Perfect for all fitness levels.',
        benefits: [
            'Improved cardiovascular health',
            'Lower body strength and endurance',
            'Low-impact workout',
            'Calorie burning',
            'Stress reduction'
        ],
        trainers: [
            {
                name: 'Sarah Lee',
                role: 'Lead Cycling Instructor',
                image: 'coach-sarah.jpg'
            },
            {
                name: 'Alex Green',
                role: 'Cycling Specialist',
                image: 'coach-alex.jpg'
            }
        ]
    };

    res.render('booking-cycling', {
        title: 'Book Cycling Class',
        currentPage: 'booking',
        classData: classData
    });
});

// Trainer booking routes
app.get('/booking/emily', (req, res) => {
    console.log('Rendering Emily booking page');
    const trainerData = {
        id: 'emily',
        name: 'Emily Smith',
        role: 'Lead Pilates Instructor',
        specialties: ['Pilates', 'Yoga', 'Core Training'],
        experience: '8 years',
        image: 'coach-emily.jpg',
        description: 'Emily is a certified Pilates and Yoga instructor with over 8 years of experience. She specializes in core strengthening and flexibility training.',
        classes: [
            {
                name: 'Pilates Fundamentals',
                schedule: 'Mon, Wed, Fri 9:00 AM',
                duration: '50 mins',
                level: 'All Levels'
            },
            {
                name: 'Core & Flexibility',
                schedule: 'Tue, Thu 10:00 AM',
                duration: '45 mins',
                level: 'Intermediate'
            }
        ],
        certifications: [
            'Certified Pilates Instructor',
            'RYT-500 Yoga Certification',
            'Core Training Specialist'
        ]
    };

    res.render('booking-emily', {
        title: 'Book with Emily Smith',
        currentPage: 'booking',
        trainerData: trainerData
    });
});

app.get('/booking/john', (req, res) => {
    console.log('Rendering John booking page');
    const trainerData = {
        id: 'john',
        name: 'John Doe',
        role: 'Lead Boxing Coach',
        specialties: ['Boxing', 'HIIT', 'Strength Training'],
        experience: '10 years',
        image: 'coach-john.jpg',
        description: 'John is a professional boxing coach with extensive experience in HIIT and strength training. He helps clients achieve their fitness goals through dynamic workouts.',
        classes: [
            {
                name: 'Boxing Fundamentals',
                schedule: 'Mon, Wed, Fri 5:00 PM',
                duration: '45 mins',
                level: 'All Levels'
            },
            {
                name: 'HIIT Training',
                schedule: 'Tue, Thu 6:00 PM',
                duration: '45 mins',
                level: 'Advanced'
            }
        ],
        certifications: [
            'Professional Boxing Coach',
            'HIIT Specialist',
            'Strength & Conditioning Coach'
        ]
    };

    res.render('booking-john', {
        title: 'Book with John Doe',
        currentPage: 'booking',
        trainerData: trainerData
    });
});

app.get('/booking/sarah', (req, res) => {
    console.log('Rendering Sarah booking page');
    const trainerData = {
        id: 'sarah',
        name: 'Sarah Lee',
        role: 'Lead Yoga & Cycling Instructor',
        specialties: ['Yoga', 'Cycling', 'Mind-Body Training'],
        experience: '7 years',
        image: 'coach-sarah.jpg',
        description: 'Sarah combines her expertise in yoga and cycling to create balanced, effective workouts that focus on both physical and mental well-being.',
        classes: [
            {
                name: 'Yoga Flow',
                schedule: 'Mon, Wed, Fri 8:00 AM',
                duration: '60 mins',
                level: 'All Levels'
            },
            {
                name: 'Indoor Cycling',
                schedule: 'Tue, Thu 5:30 PM',
                duration: '45 mins',
                level: 'Intermediate'
            }
        ],
        certifications: [
            'RYT-500 Yoga Certification',
            'Cycling Instructor Certification',
            'Mind-Body Training Specialist'
        ]
    };

    res.render('booking-sarah', {
        title: 'Book with Sarah Lee',
        currentPage: 'booking',
        trainerData: trainerData
    });
});

app.get('/booking/alex', (req, res) => {
    console.log('Rendering Alex booking page');
    const trainerData = {
        id: 'alex',
        name: 'Alex Green',
        role: 'Lead Calisthenics Coach',
        specialties: ['Calisthenics', 'Cycling', 'Strength Training'],
        experience: '6 years',
        image: 'coach-alex.jpg',
        description: 'Alex specializes in calisthenics and bodyweight training, helping clients build strength and control through progressive movement patterns.',
        classes: [
            {
                name: 'Calisthenics Basics',
                schedule: 'Mon, Wed, Fri 4:00 PM',
                duration: '45 mins',
                level: 'Beginner'
            },
            {
                name: 'Advanced Calisthenics',
                schedule: 'Tue, Thu 5:00 PM',
                duration: '60 mins',
                level: 'Advanced'
            }
        ],
        certifications: [
            'Calisthenics Coach Certification',
            'Strength Training Specialist',
            'Cycling Instructor'
        ]
    };

    res.render('booking-alex', {
        title: 'Book with Alex Green',
        currentPage: 'booking',
        trainerData: trainerData
    });
});

app.get('/booking/ryan', (req, res) => {
    console.log('Rendering Ryan booking page');
    const trainerData = {
        id: 'ryan',
        name: 'Ryan Clark',
        role: 'Boxing & Calisthenics Specialist',
        specialties: ['Boxing', 'Calisthenics', 'HIIT'],
        experience: '5 years',
        image: 'coach-ryan.jpg',
        description: 'Ryan combines boxing techniques with calisthenics to create dynamic, high-energy workouts that build strength and endurance.',
        classes: [
            {
                name: 'Boxing & Conditioning',
                schedule: 'Mon, Wed, Fri 6:00 PM',
                duration: '45 mins',
                level: 'Intermediate'
            },
            {
                name: 'Calisthenics & HIIT',
                schedule: 'Tue, Thu 4:00 PM',
                duration: '45 mins',
                level: 'Advanced'
            }
        ],
        certifications: [
            'Boxing Coach Certification',
            'Calisthenics Specialist',
            'HIIT Training Certification'
        ]
    };

    res.render('booking-ryan', {
        title: 'Book with Ryan Clark',
        currentPage: 'booking',
        trainerData: trainerData
    });
});

app.get('/booking/laura', (req, res) => {
    console.log('Rendering Laura booking page');
    const trainerData = {
        id: 'laura',
        name: 'Laura White',
        role: 'Yoga & Pilates Specialist',
        specialties: ['Yoga', 'Pilates', 'Mind-Body Training'],
        experience: '6 years',
        image: 'coach-laura.jpg',
        description: 'Laura specializes in combining yoga and Pilates to create balanced, mindful workouts that improve strength, flexibility, and mental well-being.',
        classes: [
            {
                name: 'Yoga & Pilates Fusion',
                schedule: 'Mon, Wed, Fri 10:00 AM',
                duration: '60 mins',
                level: 'All Levels'
            },
            {
                name: 'Mindful Movement',
                schedule: 'Tue, Thu 9:00 AM',
                duration: '45 mins',
                level: 'Beginner'
            }
        ],
        certifications: [
            'RYT-200 Yoga Certification',
            'Pilates Mat Certification',
            'Mind-Body Training Specialist'
        ]
    };

    res.render('booking-laura', {
        title: 'Book with Laura White',
        currentPage: 'booking',
        trainerData: trainerData
    });
});

// POST route handler for class bookings
app.post('/bookings', async (req, res) => {
    console.log('=== Processing New Booking ===');
    console.log('Request body:', req.body);
    
    try {
        // Validate required fields
        const requiredFields = ['name', 'email', 'phone', 'className', 'classType', 'difficulty', 'place', 'trainer'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).render('error', {
                message: 'Missing required fields',
                error: { details: missingFields }
            });
        }

        // Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB connection is not ready. Current state: ' + mongoose.connection.readyState);
        }

        // Create booking object
        const bookingData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            className: req.body.className,
            classType: req.body.classType,
            difficulty: req.body.difficulty,
            calories: parseInt(req.body.calories) || 500,
            duration: parseInt(req.body.duration) || 45,
            place: req.body.place,
            trainer: req.body.trainer,
            status: 'confirmed',
            bookingDate: new Date()
        };

        // Create and save booking to MongoDB
        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();
        console.log('Booking saved to MongoDB:', savedBooking);

        // Verify the booking was saved
        const verifyBooking = await Booking.findById(savedBooking._id);
        if (!verifyBooking) {
            throw new Error('Booking verification failed - could not find saved booking');
        }

        // Store booking data in session
        req.session.bookingData = savedBooking;
        
        // Save session and redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).render('error', {
                    message: 'Error saving booking session',
                    error: err
                });
            }
            res.redirect('/booking/confirmation');
        });
    } catch (error) {
        console.error('Error saving booking:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).render('error', {
            message: 'Error processing booking',
            error: error
        });
    }
});

// POST route handler for booking with a trainer
app.post('/booking/:trainer', async (req, res) => {
    const trainerSlug = req.params.trainer;
    
    console.log('=== Processing New Trainer Booking ===');
    console.log('Request body:', req.body);
    console.log('Trainer Slug:', trainerSlug);

    // Find the trainer name (you can use a more robust lookup if needed)
    const trainers = {
        'emily': 'Emily Smith',
        'john': 'John Doe',
        'ryan': 'Ryan Clark',
        'laura': 'Laura White',
        'sarah': 'Sarah Lee',
        'alex': 'Alex Green'
    };

    const trainerName = trainers[trainerSlug] || trainerSlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    try {
        // Combine date and time into a Date object
        const bookingDateTime = new Date(`${req.body.date}T${req.body.time}:00`);

        // Create booking object for trainer session
        const bookingData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            // Set class-related fields to indicate trainer session or defaults
            className: 'Trainer Session',
            classType: 'Personal Training',
            difficulty: 'N/A',
            calories: 0,
            duration: 60, // Assuming a default duration for trainer sessions
            place: req.body.location, // Map location from form to place field
            trainer: trainerName, // Use the trainer's full name
            status: 'pending', // Initial status for trainer bookings
            bookingDate: bookingDateTime, // Use the combined date and time
            packageId: req.body.packageId, // Include packageId
            goals: req.body.goals // Include goals
        };

         // Verify MongoDB connection
         if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB connection is not ready. Current state: ' + mongoose.connection.readyState);
        }

        // Create and save booking to MongoDB
        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();
        console.log('Trainer booking saved to MongoDB:', savedBooking);

         // Verify the booking was saved (optional but good for debugging)
         const verifyBooking = await Booking.findById(savedBooking._id);
         if (!verifyBooking) {
             throw new Error('Trainer booking verification failed - could not find saved booking');
         }

        // Store booking data in session (optional, for confirmation page display)
        req.session.bookingData = savedBooking; // Store the saved booking object

        // Save session and redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).render('error', {
                    message: 'Error saving booking session',
                    error: err
                });
            }
             // Redirect to confirmation page
            res.redirect('/booking/confirmation'); // Simplified redirect URL
        });

    } catch (error) {
        console.error('Error saving trainer booking:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).render('error', {
            message: 'Error processing trainer booking',
            error: error
        });
    }
});

// Booking confirmation route
app.get('/booking/confirmation', async (req, res) => {
    console.log('=== Rendering Confirmation Page ===');
    console.log('Session data:', req.session);
    
    try {
        let bookingData = null;
        let hasBookingData = false;

        // First try to get booking from session
        if (req.session.bookingData && Object.keys(req.session.bookingData).length > 0) {
            console.log('Found booking data in session:', req.session.bookingData);
            bookingData = req.session.bookingData;
            hasBookingData = true;
        } else {
            // If no booking in session, try to get latest booking from MongoDB
            console.log('No booking data in session, checking MongoDB...');
            const latestBooking = await Booking.findOne().sort({ createdAt: -1 });
            
            if (latestBooking) {
                console.log('Found latest booking in MongoDB:', latestBooking);
                bookingData = {
                    name: latestBooking.name,
                    email: latestBooking.email,
                    phone: latestBooking.phone,
                    className: latestBooking.className,
                    classType: latestBooking.classType,
                    difficulty: latestBooking.difficulty,
                    calories: latestBooking.calories,
                    duration: latestBooking.duration,
                    place: latestBooking.place,
                    trainer: latestBooking.trainer,
                    status: latestBooking.status,
                    bookingDate: latestBooking.bookingDate,
                    _id: latestBooking._id,
                    createdAt: latestBooking.createdAt,
                    updatedAt: latestBooking.updatedAt
                };
                hasBookingData = true;

                // Store in session for future use
                req.session.bookingData = bookingData;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }

        console.log('Final booking data to display:', bookingData);
        console.log('Has booking data:', hasBookingData);

        res.render('booking-confirmation', {
            title: 'Booking Confirmation',
            currentPage: 'booking',
            hasBookingData: hasBookingData,
            bookingData: bookingData || {}
        });
    } catch (error) {
        console.error('Error rendering confirmation page:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).render('error', {
            message: 'Error displaying booking confirmation',
            error: error
        });
    }
});

// Shop routes
app.get('/shop', async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('shop', {
            title: 'Shop',
            currentPage: 'shop',
            products
        });
    } catch (error) {
        console.error('Error fetching shop products:', error);
        res.status(500).render('error', { message: 'Failed to load shop products' });
    }
});

app.get('/supplements', async (req, res) => {
    try {
        const products = await Product.find({ category: 'Supplements' });
        res.render('supplements', {
            title: 'Supplements',
            currentPage: 'supplements',
            products
        });
    } catch (error) {
        console.error('Error fetching supplements:', error);
        res.status(500).render('error', { message: 'Failed to load supplements' });
    }
});

app.get('/equipment', async (req, res) => {
    try {
        const products = await Product.find({ category: 'Equipment' });
        res.render('equipment', {
            title: 'Equipment',
            currentPage: 'equipment',
            products
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).render('error', { message: 'Failed to load equipment' });
    }
});

app.get('/on-sale', async (req, res) => {
    try {
        const products = await Product.find({ onSale: true }); // Assuming a boolean 'onSale' field in product schema
        res.render('on-sale', {
            title: 'On Sale',
            currentPage: 'on-sale',
            products
        });
    } catch (error) {
        console.error('Error fetching on-sale products:', error);
        res.status(500).render('error', { message: 'Failed to load on-sale products' });
    }
});

app.get('/all-products', async (req, res) => {
    try {
        const products = await Product.find({});
        const categories = [
            { value: 'equipment', label: 'Equipment' },
            { value: 'supplements', label: 'Supplements' },
            { value: 'accessories', label: 'Accessories' },
            { value: 'recovery', label: 'Recovery' }
        ];

        const priceRanges = [
            { value: '0-50', label: '$0 - $50' },
            { value: '50-100', label: '$50 - $100' },
            { value: '100-200', label: '$100 - $200' },
            { value: '200+', label: '$200+' }
        ];

        const sortOptions = [
            { value: 'featured', label: 'Featured' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'name-asc', label: 'Name: A-Z' },
            { value: 'name-desc', label: 'Name: Z-A' }
        ];

        res.render('all-products', {
            title: 'All Products',
            currentPage: 'all-products',
            products,
            categories,
            priceRanges,
            sortOptions
        });
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).render('error', { message: 'Failed to load products' });
    }
});

// User routes
app.get('/user', (req, res) => {
    // In a real application, you would get this data from your database
    // const userData = { ... }; // Removed hardcoded data

    // Get user data from session
    const userData = req.session.userData;

    // If user data is not in session, redirect to home or login
    if (!userData) {
        console.log('No user data found in session for /user route, redirecting.');
        return res.redirect('/'); // Or redirect to login page
    }

    res.render('user', {
        title: 'My Account',
        currentPage: 'user',
        userData
    });
});

app.get('/members', (req, res) => {
    res.render('members', {
        title: 'Members',
        currentPage: 'members'
    });
});

app.get('/orders', (req, res) => {
    res.render('orders', {
        title: 'Orders',
        currentPage: 'orders'
    });
});

// Admin routes - protect all admin routes with requireAdmin middleware
app.get('/admin', requireAdmin, async (req, res) => {
    try {
        // Get real-time stats from database
        const memberCount = await User.countDocuments();
        const activeClassCount = await Class.countDocuments({ status: 'Active' });
        const orderCount = await Order.countDocuments();

        res.render('admin', {
            title: 'Admin Dashboard',
            currentPage: 'dashboard',
            layout: 'layouts/admin',
            stats: {
                memberCount,
                classCount: activeClassCount,
                orderCount
            },
            recentClasses: await Class.find()
                .sort({ createdAt: -1 })
                .limit(3)
                .select('name coach status category'),
            activities: [
                { icon: 'fas fa-user-plus', description: 'New member joined', time: '2 hours ago' },
                { icon: 'fas fa-dumbbell', description: 'New class added', time: '4 hours ago' },
                { icon: 'fas fa-shopping-cart', description: 'New order received', time: '6 hours ago' }
            ],
            systemStatus: [
                { title: 'System Health', value: 'Good', status: 'success', description: 'All systems operational' },
                { title: 'Server Load', value: '45%', status: 'warning', description: 'Moderate load' },
                { title: 'Storage', value: '75%', status: 'warning', description: 'Storage space available' }
            ]
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading dashboard',
            error: error
        });
    }
});

// Function to sync all products to MongoDB
async function syncAllProductsToMongoDB() {
    try {
        // Get all products from different sections
        const allProducts = [
            {
                name: 'Premium Whey Protein',
                category: 'Supplements',
                price: 49.99,
                stock: 50,
                description: 'High-quality whey protein for muscle recovery',
                image: 'whey protein.jpg'
            },
            {
                name: 'Resistance Bands Set',
                category: 'Equipment',
                price: 39.99,
                stock: 30,
                description: 'Set of 5 resistance bands for full-body workouts',
                image: 'resistance.jpg'
            },
            {
                name: 'Pro Training Gloves',
                category: 'Accessories',
                price: 32.99,
                stock: 45,
                description: 'Durable training gloves with wrist support',
                image: 'glove.avif'
            },
            {
                name: 'L-Glutamine 500mg',
                category: 'Supplements',
                price: 19.99,
                stock: 40,
                description: 'Pure L-Glutamine powder for muscle recovery',
                image: 'glytamine.jpg'
            },
            {
                name: 'BCAA Complex',
                category: 'Supplements',
                price: 24.99,
                stock: 35,
                description: 'Branched-chain amino acids for recovery',
                image: 'bcaa.jpg'
            },
            {
                name: 'Adjustable Dumbbells',
                category: 'Equipment',
                price: 129.99,
                stock: 20,
                description: 'Professional adjustable dumbbells for strength training',
                image: 'dunbell.jpg'
            },
            {
                name: 'Pre-Workout Energy',
                category: 'Supplements',
                price: 34.99,
                stock: 45,
                description: 'Advanced pre-workout formula for maximum performance',
                image: 'preworkout.jpg'
            },
            {
                name: 'Kettlebell Set',
                category: 'Equipment',
                price: 199.99,
                stock: 15,
                description: 'Professional grade kettlebell set for functional training',
                image: 'ket.jpg'
            },
            {
                name: 'Gym Bag',
                category: 'Accessories',
                price: 59.99,
                stock: 25,
                description: 'Spacious gym bag with multiple compartments',
                image: 'bag.jpg'
            },
            {
                name: 'Foam Roller',
                category: 'Recovery',
                price: 29.99,
                stock: 40,
                description: 'High-density foam roller for muscle recovery',
                image: 'foam.jpg'
            },
            {
                name: 'Lifting Belt',
                category: 'Accessories',
                price: 45.99,
                stock: 30,
                description: 'Professional weightlifting belt for support',
                image: 'belt.jpg'
            },
            {
                name: 'Lifting Straps',
                category: 'Accessories',
                price: 19.99,
                stock: 50,
                description: 'Heavy-duty lifting straps for better grip',
                image: 'Gym straps.jpg'
            }
        ];

        // Clear existing products
        await Product.deleteMany({});
        
        // Insert all products
        await Product.insertMany(allProducts);
        console.log('All products synced to MongoDB successfully');
        
        return allProducts;
    } catch (error) {
        console.error('Error syncing products to MongoDB:', error);
        throw error;
    }
}

// Modify the admin shop route to use synced products
app.get('/admin/shop', requireAdmin, async (req, res) => {
    try {
        // Try to get products from MongoDB first
        let products = await Product.find({});
        
        // If no products in MongoDB, sync them
        if (!products || products.length === 0) {
            products = await syncAllProductsToMongoDB();
        }

        // Update session with current products
        req.session.products = products;

        const categories = [
            { value: 'Supplements', label: 'Supplements' },
            { value: 'Equipment', label: 'Equipment' },
            { value: 'Accessories', label: 'Accessories' },
            { value: 'Recovery', label: 'Recovery' }
        ];

        res.render('admin-shop', {
            title: 'Shop Management',
            currentPage: 'shop',
            layout: 'layouts/admin',
            products: products,
            categories: categories
        });
    } catch (error) {
        console.error('Error in admin shop route:', error);
        res.status(500).render('error', {
            message: 'Error loading shop management',
            error: error
        });
    }
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images'); // Upload images to the public/images directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Error handling middleware for Multer (optional but good practice)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message });
    } else if (err) {
        console.error('Unknown error during file upload:', err);
        return res.status(500).json({ error: 'An unknown error occurred during file upload.' });
    }
    next();
});

// Add new product
app.post('/admin/shop/products', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const newProductData = {
            name: req.body.name,
            category: req.body.category,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            description: req.body.description,
            image: req.file ? req.file.filename : 'default-product.jpg' // Use uploaded filename or default
        };

        const mongoProduct = new Product(newProductData);
        await mongoProduct.save();
        console.log('Product saved to MongoDB:', mongoProduct);

        res.json({ success: true, product: mongoProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Update product
app.put('/admin/shop/products/:id', requireAdmin, async (req, res) => {
    try {
        const updatedProductData = {
            name: req.body.name,
            category: req.body.category,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            description: req.body.description
        };

        if (req.body.image) {
            updatedProductData.image = req.body.image;
        }

        const mongoProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updatedProductData,
            { new: true }
        );

        if (!mongoProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log('Product updated in MongoDB:', mongoProduct);
        res.json({ success: true, product: mongoProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
app.delete('/admin/shop/products/:id', requireAdmin, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Route to manually sync products to MongoDB
app.post('/admin/shop/sync', requireAdmin, async (req, res) => {
    try {
        const products = await syncAllProductsToMongoDB();
        res.json({ success: true, message: 'Products synced successfully', count: products.length });
    } catch (error) {
        console.error('Error syncing products:', error);
        res.status(500).json({ success: false, error: 'Failed to sync products' });
    }
});

app.get('/admin/members', requireAdmin, async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find().select('-password'); // Exclude password field
        
        // Transform user data to match the expected format
        const members = users.map(user => ({
            id: user._id,
            name: user.fullName || user.username,
            email: user.email,
            membershipType: user.membership?.tier || 'Basic',
            status: user.membership?.status || 'Pending',
            registeredDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A',
            lastVisit: user.lastVisit ? new Date(user.lastVisit).toISOString().split('T')[0] : 'N/A',
            profileImage: user.avatar || "default.jpg",
            enrolledClasses: user.classes || [],
            classesAttended: user.stats?.classesAttended || 0,
            trainerSessions: user.stats?.trainerSessions || 0
        }));

        res.render('members', {
            title: 'Member Management',
            currentPage: 'members',
            layout: 'layouts/admin',
            stats: {
                total: members.length,
                active: members.filter(m => m.status.toLowerCase() === 'active').length,
                expired: members.filter(m => m.status.toLowerCase() === 'expired').length,
                mostPopular: members.reduce((acc, curr) => {
                    acc[curr.membershipType] = (acc[curr.membershipType] || 0) + 1;
                    return acc;
                }, {})
            },
            membershipTypes: ['Basic', 'Premium', 'VIP'],
            statusTypes: ['Active', 'Expired', 'Pending'],
            members: members,
            member: members[0], // For the profile modal
            activityLogs: [
                {
                    timestamp: new Date().toLocaleString(),
                    action: "Members Loaded",
                    details: `Loaded ${members.length} members from database`
                }
            ],
            equipmentAccessLevels: [
                { value: "basic", label: "Basic Equipment" },
                { value: "standard", label: "Standard Equipment" },
                { value: "premium", label: "Premium Equipment" },
                { value: "all", label: "All Equipment" }
            ],
            totalPages: 1
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).render('error', {
            message: 'Error loading members',
            error: error
        });
    }
});

// Add/Update member
app.post('/admin/members', requireAdmin, (req, res) => {
    try {
        // Initialize members array in session if it doesn't exist
        if (!req.session.members) {
            req.session.members = [];
        }

        const newMember = {
            id: req.body.memberId || Date.now(),
            name: req.body.name,
            email: req.body.email,
            membershipType: req.body.membershipType,
            status: req.body.status,
            registeredDate: new Date().toISOString().split('T')[0],
            lastVisit: new Date().toISOString().split('T')[0],
            profileImage: "default.jpg",
            enrolledClasses: [],
            classesAttended: parseInt(req.body.classesAttended) || 0,
            trainerSessions: parseInt(req.body.trainerSessions) || 0,
            classLimit: parseInt(req.body.classLimit) || 0,
            equipmentAccess: req.body.equipmentAccess || 'basic'
        };

        // If editing (ID exists), update existing member
        if (req.body.memberId) {
            const index = req.session.members.findIndex(m => m.id === parseInt(req.body.memberId));
            if (index !== -1) {
                // Preserve some data when updating
                newMember.enrolledClasses = req.session.members[index].enrolledClasses;
                newMember.registeredDate = req.session.members[index].registeredDate;
                req.session.members[index] = newMember;
            } else {
                req.session.members.push(newMember);
            }
        } else {
            // Add new member
            req.session.members.push(newMember);
        }

        // Save session
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save member' });
            }
            res.json({ success: true, member: newMember });
        });
    } catch (error) {
        console.error('Error saving member:', error);
        res.status(500).json({ error: 'Failed to save member' });
    }
});

// Update member (PUT)
app.put('/admin/members', requireAdmin, (req, res) => {
    try {
        if (!req.session.members) {
            return res.status(404).json({ error: 'No members found' });
        }

        const index = req.session.members.findIndex(m => m.id === parseInt(req.body.memberId));
        if (index === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Update member data
        const updatedMember = {
            ...req.session.members[index],
            name: req.body.name,
            email: req.body.email,
            membershipType: req.body.membershipType,
            status: req.body.status,
            classLimit: parseInt(req.body.classLimit) || 0,
            trainerSessions: parseInt(req.body.trainerSessions) || 0,
            equipmentAccess: req.body.equipmentAccess
        };

        req.session.members[index] = updatedMember;

        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to update member' });
            }
            res.json({ success: true, member: updatedMember });
        });
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Delete member
app.delete('/admin/members/:id', requireAdmin, async (req, res) => {
    try {
        const memberId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(memberId);
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

// Bulk delete members
app.post('/admin/members/bulk-delete', requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid member IDs' });
        }

        const result = await User.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'No members found to delete' });
        }

        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Error deleting members:', error);
        res.status(500).json({ error: 'Failed to delete members' });
    }
});

app.get('/admin/orders', requireAdmin, (req, res) => {
    // Get orders from session or use default data
    const orders = req.session.orders || [
        {
            id: 1,
            customer: 'John Doe',
            items: 3,
            total: 89.97,
            status: 'Pending',
            date: '2024-03-15',
            products: [
                { name: 'Protein Powder', quantity: 1, price: 49.99 },
                { name: 'Resistance Bands', quantity: 2, price: 19.99 }
            ]
        },
        {
            id: 2,
            customer: 'Jane Smith',
            items: 2,
            total: 45.98,
            status: 'Completed',
            date: '2024-03-14',
            products: [
                { name: 'Yoga Mat', quantity: 1, price: 25.99 },
                { name: 'Water Bottle', quantity: 1, price: 19.99 }
            ]
        }
    ];

    res.render('orders', {
        title: 'Order Management',
        currentPage: 'orders',
        layout: 'layouts/admin',
        orders: orders
    });
});

// Update order status
app.put('/admin/orders/:id/status', requireAdmin, (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const newStatus = req.body.status;

        if (!req.session.orders) {
            return res.status(404).json({ error: 'No orders found' });
        }

        const order = req.session.orders.find(o => o.id === orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = newStatus;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to update order status' });
            }
            res.json({ success: true, order: order });
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Get order details
app.get('/admin/orders/:id', requireAdmin, (req, res) => {
    try {
        const orderId = parseInt(req.params.id);

        if (!req.session.orders) {
            return res.status(404).json({ error: 'No orders found' });
        }

        const order = req.session.orders.find(o => o.id === orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({ error: 'Failed to get order details' });
    }
});

// Admin classes routes
app.get('/admin/classes', requireAdmin, async (req, res) => {
    try {
        const classes = await ClassModel.find({});
        // Fetch unique categories from the ClassModel
        const categories = await ClassModel.distinct('category');
        res.render('admin-classes', {
            title: 'Class Management',
            currentPage: 'classes',
            layout: 'layouts/admin',
            classes: classes,
            categories: categories // Pass categories to the template
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).render('error', { 
            message: 'Error loading classes',
            error: error
        });
    }
});

// Add new class
app.post('/admin/classes', requireAdmin, async (req, res) => {
    try {
        const newClass = new ClassModel({
            name: req.body.name,
            coach: req.body.coach,
            category: req.body.category,
            schedule: new Date(req.body.schedule),
            capacity: parseInt(req.body.capacity),
            description: req.body.description,
            status: req.body.status || 'Active',
            enrolled: 0
        });

        await newClass.save();
        res.json({ success: true, class: newClass });
    } catch (error) {
        console.error('Error saving class:', error);
        res.status(500).json({ error: 'Failed to save class' });
    }
});

// Update class
app.put('/admin/classes/:id', requireAdmin, async (req, res) => {
    try {
        const updatedClass = await ClassModel.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                coach: req.body.coach,
                category: req.body.category,
                schedule: new Date(req.body.schedule),
                capacity: parseInt(req.body.capacity),
                description: req.body.description,
                status: req.body.status
            },
            { new: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ success: true, class: updatedClass });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ error: 'Failed to update class' });
    }
});

// Delete class
app.delete('/admin/classes/:id', requireAdmin, async (req, res) => {
    try {
        const deletedClass = await ClassModel.findByIdAndDelete(req.params.id);
        
        if (!deletedClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
});

// Process pages
app.get('/process', (req, res) => {
    res.render('process', {
        title: 'Our Process',
        currentPage: 'process',
        steps: [
            { number: 1, title: 'Assessment', description: 'Initial fitness evaluation' },
            { number: 2, title: 'Planning', description: 'Customized workout plan' },
            { number: 3, title: 'Training', description: 'Regular sessions with coaches' },
            { number: 4, title: 'Progress', description: 'Regular progress tracking' }
        ],
        trainers: [
            {
                name: 'Alex Johnson',
                image: 'coach-alex.jpg',
                specialty: 'Strength Training',
                experience: 8
            },
            {
                name: 'Sarah Williams',
                image: 'coach-sarah.jpg',
                specialty: 'Yoga & Flexibility',
                experience: 6
            },
            {
                name: 'John Doe',
                image: 'coach-john.jpg',
                specialty: 'HIIT & Cardio',
                experience: 10
            }
        ],
        classes: [
            {
                name: 'Yoga Flow',
                image: 'yoga.jpg',
                schedule: 'Mon, Wed, Fri 9:00 AM',
                description: 'Perfect for all levels'
            },
            {
                name: 'HIIT Training',
                image: 'hiit.jpg',
                schedule: 'Tue, Thu 6:00 PM',
                description: 'High-intensity interval training'
            },
            {
                name: 'Strength & Conditioning',
                image: 'strength.jpg',
                schedule: 'Mon, Wed, Fri 5:00 PM',
                description: 'Build strength and endurance'
            }
        ],
        startDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    });
});

app.get('/annual-process', (req, res) => {
    res.render('annual-process', {
        title: 'Annual Process',
        currentPage: 'process',
        steps: [
            { number: 1, title: 'Assessment', description: 'Initial fitness evaluation' },
            { number: 2, title: 'Planning', description: 'Customized workout plan' },
            { number: 3, title: 'Training', description: 'Regular sessions with coaches' },
            { number: 4, title: 'Progress', description: 'Regular progress tracking' }
        ]
    });
});

// Handle membership payment submission
app.post('/membership/payment', async (req, res) => {
    // In a real application, you would process the payment here
    // Access the submitted data from req.body
    const planId = req.body.planId;
    const trainerId = req.body.trainerId;
    const classIds = req.body.classIds; // This will be a comma-separated string
    const cardNumber = req.body.cardNumber;
    const expiryDate = req.body.expiryDate;
    const cvv = req.body.cvv;
    const cardName = req.body.cardName;
    const email = req.body.email;

    console.log('Received Payment Submission:');
    console.log('Plan ID:', planId);
    console.log('Trainer ID:', trainerId);
    console.log('Class IDs:', classIds);
    console.log('Card Number:', cardNumber ? '**** **** **** ' + cardNumber.slice(-4) : 'N/A'); // Log last 4 digits
    console.log('Expiry Date:', expiryDate);
    console.log('CVV:', cvv ? '*' : 'N/A'); // Don't log actual CVV
    console.log('Card Name:', cardName);
    console.log('Email:', email);

    // Create a new payment document
    const newPayment = new Payment({
        cardNumber: cardNumber,
        expiryDate: expiryDate,
        nameOnCard: cardName,
        email: email,
        // You might want to add other fields like planId, trainerId, classIds here as well
    });

    try {
        // Save the payment to the database
         await newPayment.save();
        console.log('Payment saved to database');

        // Simulate successful payment processing
        // Redirect to a confirmation page or send a success response
        // res.send('Payment received successfully! Thank you for your purchase.');
        // Or redirect:
        res.redirect('/membership/confirmation'); // You would need to create this route and template
    } catch (error) {
        console.error('Error saving payment to database:', error);
        res.status(500).send('Error processing payment.');
    }
});

// Confirmation page route
app.get('/membership/confirmation', (req, res) => {
    res.render('confirmation', {
        title: 'Membership Confirmation',
        currentPage: 'confirmation'
    });
});

// Signup routes
app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'Sign Up',
        currentPage: 'signup'
    });
});

app.post('/signup', async (req, res) => {
    const { username, email, password, 'confirm-password': confirmPassword } = req.body;
    
    try {
        // Check if username already exists in the database
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Validate password length
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        // Create new user document
        const newUser = new User({
            username,
            email,
            password, // Remember: In a real app, this should be hashed!
            fullName: username, // Using username as full name as before
            avatar: "https://randomuser.me/api/portraits/lego/1.jpg", // Default avatar
            membership: {
                tier: "Basic Member",
                plan: "Starter Plan",
                startDate: new Date(), // Store as Date object
                renewal: "Monthly",
                nextPayment: new Date(Date.now() + 30*24*60*60*1000), // Store as Date object
                status: "active"
            },
            stats: {
                classesAttended: 0,
                hoursWorked: 0,
                achievementsEarned: 0,
                daysStreak: 0
            },
            upcomingClasses: []
        });

        // Save user to the database
        const savedUser = await newUser.save();
        console.log('User saved to database:', savedUser);

        // Log the user in by storing data in session
        req.session.loggedInUser = savedUser.username; // Use username from saved user
        req.session.userData = savedUser; // Store the full saved user object

        // Save session before redirecting
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Error creating account. Please try again.' });
            }
            // Redirect on success
            res.json({ success: true, redirect: '/user' });
        });

    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'An error occurred during signup. Please try again.' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something broke!',
        error: err
    });
});

// Routes
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});