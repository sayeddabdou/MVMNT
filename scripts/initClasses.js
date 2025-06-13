const mongoose = require('mongoose');
const Class = require('../models/Class');

// MongoDB Connection
const mongoURI = 'mongodb+srv://database:database123@cluster0.u6ry3ky.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

// Default classes data
const defaultClasses = [
    {
        name: 'Yoga Flow',
        coach: 'Sarah Williams',
        category: 'Yoga',
        schedule: new Date('2024-03-25T09:00:00'), // Monday 9 AM
        capacity: 20,
        description: 'Perfect for all levels. Focus on flexibility and mindfulness.',
        status: 'Active',
        enrolled: 0
    },
    {
        name: 'HIIT Training',
        coach: 'John Doe',
        category: 'HIIT',
        schedule: new Date('2024-03-26T18:00:00'), // Tuesday 6 PM
        capacity: 15,
        description: 'High-intensity interval training for maximum calorie burn.',
        status: 'Active',
        enrolled: 0
    },
    {
        name: 'Strength Training',
        coach: 'Alex Johnson',
        category: 'Strength',
        schedule: new Date('2024-03-25T17:00:00'), // Monday 5 PM
        capacity: 12,
        description: 'Build strength and endurance with professional guidance.',
        status: 'Active',
        enrolled: 0
    },
    {
        name: 'Pilates',
        coach: 'Sarah Williams',
        category: 'Pilates',
        schedule: new Date('2024-03-27T10:00:00'), // Wednesday 10 AM
        capacity: 15,
        description: 'Core strengthening and flexibility training.',
        status: 'Active',
        enrolled: 0
    },
    {
        name: 'Boxing',
        coach: 'Mike Johnson',
        category: 'Boxing',
        schedule: new Date('2024-03-26T19:00:00'), // Tuesday 7 PM
        capacity: 10,
        description: 'Learn boxing techniques and get a full body workout.',
        status: 'Active',
        enrolled: 0
    },
    {
        name: 'Cycling',
        coach: 'John Doe',
        category: 'Cycling',
        schedule: new Date('2024-03-27T18:00:00'), // Wednesday 6 PM
        capacity: 20,
        description: 'High-energy indoor cycling class for all fitness levels.',
        status: 'Active',
        enrolled: 0
    }
];

async function initializeClasses() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            dbName: 'test'
        });
        console.log('Connected to MongoDB successfully');

        // Check if there are any existing classes
        const existingClasses = await Class.find({});
        
        if (existingClasses.length === 0) {
            // Insert default classes only if no classes exist
            await Class.insertMany(defaultClasses);
            console.log('Default classes have been added successfully!');
        } else {
            console.log('Classes already exist in the database. No default classes were added.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the initialization
initializeClasses(); 