import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
}, { _id: true }); // _id needed for updates/removals

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema]
}, { timestamps: true });

export const Cart = mongoose.model('Cart', cartSchema);
