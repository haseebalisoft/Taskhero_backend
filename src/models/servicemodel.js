import mongoose from "mongoose";

const levelOfServiceSchema = new mongoose.Schema({
  levelName: {
    type: String,
    required: true
  },
  setPrice: {
    type: Number,
    required: true
  },
  setTimePerHours: {
    type: String,
    required: true
  },
  moreOptions: [
    {
      name: { type: String, required: true },
      description: { type: String }
    }
  ]
}, { _id: false }); // Disable _id for subdocuments if not needed

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: false
    },
    images: [
      {
        type: String // Store image URLs or file paths
      }
    ],
    dimensions: {
      weightInGrams: {
        type: Number,
        default: 0
      },
      weightInKg: {
        type: Number,
        default: 0
      }
    },
    calories: {
      type: Number,
    },
    orderType: {
      type: [String]
    },
    additionalDetail: [
      {
        name: { type: String, required: true },
        description: { type: String }
      }
    ],
    
    price: {
      type: Number,
    },
    paymentMethod: {
      type: mongoose.Schema.Types.Mixed
    },
    foodType: {
      type: String
    },
    ingredientReceipt: {
      type: String // PDF file path or URL
    },
    servicetype: {
      type: String
    },
    deliverBy: {
      type: String
    },
    levelOfService: {
      type: [levelOfServiceSchema],
      validate: {
        validator: function (val) {
          return Array.isArray(val) ? val.length <= 3 : true;
        },
        message: "You can only specify up to 3 levels of service."
      }
    },
    uploadDocuments: [
      {
        type: String // URLs or file paths of uploaded documents
      }
    ],
    providerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
  },
  {
    timestamps: true
  }
);

// export default mongoose.model("Service", serviceSchema);
export const Service = mongoose.model('Service', serviceSchema);