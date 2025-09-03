import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { PaymentMethod } from "../../models/PaymentMethod.js";

export const addNewCard = asyncHandler(async (req, res) => {
  const { card_number, expiry, cvv, name_on_card } = req.body;
  if (!card_number || !expiry || !cvv || !name_on_card) {
    throw new ApiError(400, "All card fields are required");
  }
  const card = await PaymentMethod.create({
    user: req.user.id,
    card_number,
    expiry,
    cvv,
    name_on_card
  });
  return res.status(201).json(new ApiResponse(201, card, "Card added successfully"));
});
//hide cvv
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const methods = await PaymentMethod.find({ user: user_id }).select("-cvv"); // Optional: hide CVV

  return res.status(200).json(
    new ApiResponse(200, methods, "Payment methods fetched successfully")
  );
});