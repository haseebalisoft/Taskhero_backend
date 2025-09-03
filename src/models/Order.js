import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  payment_method: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod' },
  checkoutType: { type: String, enum: ['delivery', 'pickup', 'mail'], required: true },
  deliveryInfo: [{
    deliveryAddress: { type: String },
    deliveryOptions: { type: String, default: null,enum: ['standard', 'priority', 'schedule'] },
  }],
  pickupInfo: [{
    pickupAddress: { type: String },
    pickupOptions: { type: String, default: null,enum: ['standard', 'priority', 'schedule'] },
  }],
  mailInfo: [{
    yourAddress: { type: String },
    heroAddress: { type: String },
    mailOptions: { type: String , default: null, enum: ['standard', 'priority', 'schedule']}
  }],
  driverInstruction: [
    {
      collectionInstruction: { type: String, default: null },
      deliveryInstruction: { type: String, default: null }
    }
  ],

  total_price: { type: Number, required: true },
  voucherCode: { type: String, default: null },
  promoCode: { type: String, default: null },
  status: {
    type: String,
    enum: ['scheduled', 'placed', 'completed', 'cancelled'],
    default: 'placed'
  },
  allergies: { type: String, default: null },
  provider_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ScheduleInfo: {
    ScheduleDate: { type: Date, default: null },
    ScheduleTimeSlot: { type: String, default: null }
  },
  confirmation: { type: Boolean, default: false },
  qr_data: { type: String, default: null },
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, default: null }
}, { timestamps: true });


export const Order = mongoose.model('Order', orderSchema);
