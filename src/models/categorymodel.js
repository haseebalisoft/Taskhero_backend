import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: String,
    image: String,
     parent_id: mongoose.Schema.Types.ObjectId, // null for main categories
    created_at: { type: Date, default: Date.now },
    categoryIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }
    ],
    
  });
  
  export const Category = mongoose.model('Category', categorySchema);

  