import mongoose from "mongoose";
const subscriptionPlanSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    duration_days: Number,
    features: [String],
    created_at: { type: Date, default: Date.now }
  });
  
  export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);