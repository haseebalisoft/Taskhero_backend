import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    vehicleType: { type: String
      //enum: ['bike', 'car', 'van', 'truck'],
      },
    licenseNumber: { type: String },
    nationalId: { type: String },
    paymentMethods: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod'
    }],
    registrationNumber:String,
    modelYear:String,
    vehicleImages:String,
    identityCard: { type: String },
    drivingLicense: { type: String },
    vehicleLicense: { type: String },
    insurranceDcouments: { type: String },
    RightToWork: { type: String },
    
    isAvailable: { type: Boolean, default: true },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  export const Driver = mongoose.model('Driver', driverSchema);
  