// models/Profile.js
import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    profile_picture: {
      type: String,
      required: false, // optional
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    about: {
      type: String,
      required: false,
    },
    languages: {
      type: String, // single value, or change to [String] if multiple
      required: false,
    },
    servicetype: {
      type: String,
      enum: ["gig", "service", "other"], // limit options if needed
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    paymentMethods: {
      type: [String],
      enum: ["Easypaisa", "JazzCash", "Bank Transfer", "Cash", "Paypal"], // can extend list
      required: true,
    },
  },
  { timestamps: true }
);

profileSchema.index({ location: "2dsphere" }); // For geo queries

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
