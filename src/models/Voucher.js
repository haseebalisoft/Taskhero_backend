import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, // e.g., 5, 10, 15, 30
  expires_at: { type: Date },
  usage_limit: { type: Number },
  used_count: { type: Number, default: 0 }
}, { timestamps: true });

export const Voucher = mongoose.model('Voucher', voucherSchema); 