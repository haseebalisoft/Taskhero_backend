import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['read', 'unread'], default: 'unread' }
}, { timestamps: true });

export const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
