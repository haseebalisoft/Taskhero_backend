import mongoose from 'mongoose';

const authTokenSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  token: String,
  otp: String,
  type: String, // 'password_reset', 'email_verification', etc.
  verified:Boolean,
  expires_at: Date,
  created_at: { type: Date, default: Date.now }
});

const AuthToken = mongoose.model('AuthToken', authTokenSchema);

export default AuthToken;