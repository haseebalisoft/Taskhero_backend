// models/Hero.js
import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
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
      type: String, // change to [String] if multiple
      required: false,
    },
    servicetype: {
      type: String,
      enum: ["gig", "service", "other"],
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
      enum: ["Easypaisa", "JazzCash", "Bank Transfer", "Cash", "Paypal"],
      required: true,
    },
    rating: {
      type: Number,
      default: 0, // ⭐ needed because you update rating later in controller
    },
  },
  { timestamps: true }
);

heroSchema.index({ location: "2dsphere" });

const Hero = mongoose.model("Hero", heroSchema);
export default Hero;
