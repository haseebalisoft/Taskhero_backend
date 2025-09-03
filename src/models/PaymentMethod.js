import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  methodtype: {
    type: String,
  //  enum: ['PayPal', 'GooglePay', 'ApplePay', 'MasterCard', 'Visa'],
    required: true
  },
  nameOnCard: {
    type: String,
    required: true
  },
  CardNumber: {
    type: String,
    required: true
    // e.g., **** **** **** 1234
  },
  expiry: {
    type: String,
    required: true // e.g., MM/YY
  },
  cardToken: {
    type: String,
    required: false
    // token provided by payment gateway (e.g. Stripe/PayPal)
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
