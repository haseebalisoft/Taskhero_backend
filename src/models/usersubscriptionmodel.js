import mongoose from 'mongoose';
const userSubscriptionSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    plan_id: mongoose.Schema.Types.ObjectId,
    start_date: Date,
    end_date: Date,
    status: String, // 'active', 'expired', 'cancelled'
    created_at: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);