const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true // Remember to implement hashing in a real application!
    },
    fullName: {
        type: String
    },
    avatar: {
        type: String,
        default: 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    membership: {
        tier: { type: String, default: 'Basic Member' },
        plan: { type: String, default: 'Starter Plan' },
        startDate: { type: Date, default: Date.now },
        renewal: { type: String, default: 'Monthly' },
        nextPayment: { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) },
        status: { type: String, default: 'active' }
    },
    stats: {
        classesAttended: { type: Number, default: 0 },
        hoursWorked: { type: Number, default: 0 },
        achievementsEarned: { type: Number, default: 0 },
        daysStreak: { type: Number, default: 0 }
    },
    upcomingClasses: [
        {
            name: { type: String },
            trainer: { type: String },
            time: { type: String }
        }
    ]
});

const User = mongoose.model('User', userSchema);

module.exports = User; 