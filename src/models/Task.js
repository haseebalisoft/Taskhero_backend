import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId },
  location: { type: Object },
  description: { type: String },
  budget: { type: Number },
  images: [{ type: String }],
  status: { type: String, enum: ['open', 'cancelled', 'completed', 'accept', 'reject'], default: 'open' }
}, { timestamps: true });

export const Task = mongoose.model('Task', taskSchema);
