import mongoose from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Master'], required: true }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  field: { type: String, required: true }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  country_code: { type: String },
  phone_number: { type: String, index: true }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: {
    type: [Number],
    default: [0, 0]
  }
}, { _id: false });

const paymentMethodSchema = new mongoose.Schema({
  method_id: { type: String },
  method_name: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  phone: String,
  gender: String,
  dob: Date,

  // GeoJSON location for map search
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },

  pin: { type: String, default: null },
  isPinVerified: { type: Boolean, default: false },
  profile_picture: String,
  biometric_enabled: Boolean,
  email_verified: Boolean,
  
  IdentityCard: {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    identityNumber: Number,
    name: String,
    dob: String,
    religion: String,
    marital: String,
    nationality: String,
    expiredDate: String,
  },

  profileVarification: { type: Boolean, default: false },

  // --- New fields for your profile payload ---
  hero_name: { type: String }, // matches payload
  about: { type: String },
  languages: [{ type: String }],  // matches ["English", "Hindi"]
  service_types: [{ type: String }], // matches ["Gig", "Food"]
  contact: contactSchema,
  hero_location: locationSchema, // separate from main location (optional)
  payment_method: paymentMethodSchema,

  // Skills & education
  personal_info: {
    role: { type: String },        
    gender: { type: String },      
    industry: { type: String }
  },

  skills_education: {
    skills: [skillSchema],
    education: [educationSchema]
  },

  documents: [documentSchema],

  language: String,
  interests: [String],

  paymentMethods: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  }],

  refreshToken: { type: String }, 
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});




userSchema.index({ location: '2dsphere' });
userSchema.index({ "contact.phone_number": 1 }, { unique: false, sparse: true });

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "180m" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export const User = mongoose.model('User', userSchema);
