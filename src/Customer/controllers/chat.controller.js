// controllers/chat.controller.js
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ChatMessage } from "../../models/ChatMessage.js";
import { ChatThread } from "../../models/ChatThread.js";

//send messages 
export const sendMessage = asyncHandler(async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;

  if (!sender_id || !receiver_id || !message) {
    throw new ApiError(400, "sender_id, receiver_id, and message are required");
  }

  // Step 1: Find existing thread between the two participants
  let thread = await ChatThread.findOne({
    participants: { $all: [sender_id, receiver_id] },
    $expr: { $eq: [{ $size: "$participants" }, 2] } // ensure it's only between these two
  });

  // Step 2: If thread doesn't exist, create a new one
  if (!thread) {
    thread = await ChatThread.create({
      participants: [sender_id, receiver_id]
    });
  }

  // Step 3: Save message in the thread
  const newMessage = await ChatMessage.create({
    thread: thread._id,
    sender: sender_id,
    receiver: receiver_id,
    message
  });

  // Step 4: Optionally update thread status to unread (for receiver)
  thread.status = "unread";
  await thread.save();

  return res.status(200).json(
    new ApiResponse(200, newMessage, "Message sent successfully")
  );
});


// Get Inbox Threads for user
export const getInboxThreads = asyncHandler(async (req, res) => {
  const {  status } = req.query;
  const user_id=req.user.id

  if (!user_id) throw new ApiError(400, "User ID is required");

  const filter = {
    participants: user_id,
    ...(status && { status }) // optional filter by 'read' or 'unread'
  };

  const threads = await ChatThread.find(filter)
    .populate('participants', 'name email')
    .sort({ updatedAt: -1 });

  return res.status(200).json(new ApiResponse(200, threads, "Inbox threads fetched"));
});

// Get Messages in Thread
export const getThreadMessages = asyncHandler(async (req, res) => {
  const { thread_id, limit = 20, offset = 0 } = req.query;

  if (!thread_id) throw new ApiError(400, "Thread ID is required");

  const messages = await ChatMessage.find({ thread: thread_id })
    .sort({ createdAt: -1 }) // newest first
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .populate('sender', 'name')
    .populate('receiver', 'name');

  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
});

// Mark All Messages as Read in a Thread
export const markThreadAsRead = asyncHandler(async (req, res) => {
  const { thread_id} = req.body;
   const user_id=req.user.id;
  if (!thread_id || !user_id) {
    throw new ApiError(400, "Thread ID and User ID required");
  }

  // Mark all messages as read where receiver is this user
  await ChatMessage.updateMany(
    { thread: thread_id, receiver: user_id, read: false },
    { $set: { read: true } }
  );

  // Update thread status to 'read'
  await ChatThread.findByIdAndUpdate(thread_id, { status: 'read' });

  return res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
});
