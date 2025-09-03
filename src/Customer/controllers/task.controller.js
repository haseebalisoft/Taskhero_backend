import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Task } from "../../models/Task.js";
import { Offer } from "../../models/Offer.js";
import { PaymentMethod } from "../../models/PaymentMethod.js";

export const postNewTask = asyncHandler(async (req, res) => {
  const { category_id, subcategory_id, location, description, budget } = req.body;

  if (!category_id || !location || !description || !budget) {
    throw new ApiError(400, "Missing required fields");
  }

  // Parse location if sent as stringified JSON
  const parsedLocation = typeof location === "string" ? JSON.parse(location) : location;

  const imagePaths = (req.files || []).map(file =>
    path.join("/uploads/tasks", file.filename)
  );

  const task = await Task.create({
    user: req.user.id,
    category_id,
    subcategory_id,
    location: parsedLocation,
    description,
    budget,
    images: imagePaths
  });

  return res.status(201).json(new ApiResponse(201, task, "Task posted successfully"));
});

// Cancel task
export const cancelTask = asyncHandler(async (req, res) => {
  const { task_id } = req.params;
  const task = await Task.findById(task_id);

  if (!task) throw new ApiError(404, "Task not found");

  task.status = "cancelled";
  await task.save();

  return res.status(200).json(new ApiResponse(200, task, "Task cancelled successfully"));
});

// Get posted tasks by user
export const getUserTasks = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const tasks = await Task.find({ user: user_id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, tasks, "User tasks fetched"));
});

// Get offers for a task
export const getTaskOffers = asyncHandler(async (req, res) => {
  const { task_id } = req.params;
  const offers = await Offer.find({ task: task_id }).populate("user");
  return res.status(200).json(new ApiResponse(200, offers, "Offers fetched"));
});



// Pay after accepting offer
export const payForTask = asyncHandler(async (req, res) => {
  const { task_id, offer_id, payment_method_id, pin_code } = req.body;
  const user_id = req.user.id;

  if (!task_id || !offer_id || !payment_method_id || !pin_code) {
    throw new ApiError(400, "Missing required fields");
  }

  const offer = await Offer.findById(offer_id);
  if (!offer || String(offer.task) !== task_id || offer.status !== "accepted") {
    throw new ApiError(400, "Invalid offer for payment");
  }

  const payment = await PaymentMethod.create({
    user: user_id,
    task: task_id,
    offer: offer_id,
    payment_method: payment_method_id,
    amount: offer.amount,
    pin_code
  });

  return res.status(201).json(new ApiResponse(201, payment, "Payment processed"));
});