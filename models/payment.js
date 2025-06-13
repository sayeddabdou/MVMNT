const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  nameOnCard: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 