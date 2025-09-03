import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Offer } from "../../models/Offer.js";



export const createOffer = asyncHandler(async (req, res) => {
  const { task_id, price } = req.body;
  console.log(req.body)
  const user_id = req.user.id;

  if (!task_id || !user_id) {
    throw new ApiError(400, "Missing required fields");
  }

  // Prevent duplicate offers by the same user for the same task
  const existingOffer = await Offer.findOne({ task: task_id, user: user_id });
  if (existingOffer) {
    throw new ApiError(400, "You have already made an offer for this task");
  }

  const offer = await Offer.create({
    task: task_id,
    user: user_id,
    price,
    status: 'pending'
  });

  return res.status(201).json(new ApiResponse(201, offer, "Offer created successfully"));
});
export const updateOffer = asyncHandler(async (req, res) => {
  const { offer_id, price } = req.body;
  const user_id = req.user.id;

  if (!offer_id || !user_id) {
    throw new ApiError(400, "Missing required fields");
  }

  // Only allow updating pending offers
  const offer = await Offer.findOne({ _id: offer_id, user: user_id });

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  if (offer.status !== "pending") {
    throw new ApiError(400, "Only pending offers can be updated");
  }

  if (typeof price !== "undefined") {
    offer.price = price;
  }

  await offer.save();

  return res.status(200).json(new ApiResponse(200, offer, "Offer updated successfully"));
});

export const acceptOffer = asyncHandler(async (req, res) => {
  const { offer_id, task_id } = req.body;
  const user_id=req.user.id
  if (!offer_id || !task_id || !user_id) {
    throw new ApiError(400, "Missing required fields");
  }
  const offer = await Offer.findOneAndUpdate(
    { _id: offer_id, task: task_id, user: user_id },
    { status: 'accepted' },
    { new: true }
  );
  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }
  return res.status(200).json(new ApiResponse(200, offer, "Offer accepted"));
});

export const declineOffer = asyncHandler(async (req, res) => {
  const { offer_id, task_id} = req.body;
  const user_id=req.user.id

  if (!offer_id || !task_id || !user_id) {
    throw new ApiError(400, "Missing required fields");
  }

  const offer = await Offer.findOneAndUpdate(
    { _id: offer_id, task: task_id, user: user_id },
    { status: 'declined' },
    { new: true }
  );

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  return res.status(200).json(new ApiResponse(200, offer, "Offer declined"));
});
