import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  hero: { type: mongoose.Schema.Types.ObjectId, ref: 'Hero', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true },
  review: { type: String }
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);
