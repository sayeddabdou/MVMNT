const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/.+\@.+\..+/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    className: {
        type: String,
        required: [true, 'Class name is required']
    },
    classType: {
        type: String,
        required: [true, 'Class type is required']
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty level is required']
    },
    calories: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required']
    },
    place: {
        type: String,
        required: [true, 'Location is required']
    },
    trainer: {
        type: String,
        required: [true, 'Trainer name is required']
    },
    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'confirmed'
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    packageId: {
        type: String,
        required: false // Make it optional for class bookings
    },
    goals: {
        type: String,
        required: false // Make it optional for class bookings
    }
}, {
    timestamps: true,
    collection: 'bookings'
});

// Add pre-save hook for validation and logging
bookingSchema.pre('save', function(next) {
    console.log('Saving booking:', {
        name: this.name,
        email: this.email,
        className: this.className,
        trainer: this.trainer,
        status: this.status
    });
    next();
});

// Add post-save hook for logging
bookingSchema.post('save', function(doc) {
    console.log('Booking saved successfully. ID:', doc._id);
});

const Booking = mongoose.model('Booking', bookingSchema);

// Add change stream watcher
const changeStream = Booking.watch();
changeStream.on('change', data => {
    console.log('Booking collection changed:', data);
});

module.exports = Booking; 