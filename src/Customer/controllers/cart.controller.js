import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Cart } from "../../models/Cart.js";
// service_id is added into cart, even this service_id is not existing in the database....
//we can add logic here after discuss seniors to  validate service_id is valid or not 
export const addToCart = asyncHandler(async (req, res) => {
  const { service_id } = req.body;
  const userId = req.user.id;

  if (!service_id ) {
    throw new ApiError(400, "Valid service_id are required");
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Check if service already exists in cart
  const existingItem = cart.items.find(item => item.service.toString() === service_id);
  if (existingItem) {
    return res.status(400).json(new ApiResponse(400, null, "Service already exists in cart"));
  } else {
    cart.items.push({ service: service_id });
  }

  await cart.save();
  return res.status(200).json(new ApiResponse(200, cart, "Item added to cart"));
});

export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId }).populate("items.service");
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }
  return res.status(200).json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

export const updateCart = asyncHandler(async (req, res) => {
  const { item_id, quantity, schedule_time } = req.body;
  const userId = req.user.id;

  if (!item_id || typeof quantity !== "number" || quantity <= 0) {
    throw new ApiError(400, "Valid item_id and positive quantity are required");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(item_id);
  if (!item) throw new ApiError(404, "Cart item not found");

  item.quantity = quantity;
  if (schedule_time !== undefined) {
    item.schedule_time = schedule_time;
  }

  await cart.save();
  return res.status(200).json(new ApiResponse(200, cart, "Cart updated successfully"));
});

export const removeCart = asyncHandler(async (req, res) => {
  const { item_id } = req.params;
  const userId = req.user.id;

  if (!item_id) throw new ApiError(400, "item_id is required");

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(item_id);
  if (!item) throw new ApiError(404, "Cart item not found");

  item.deleteOne();
  await cart.save();

  return res.status(200).json(new ApiResponse(200, cart, "Item removed from cart"));
});

export const applyVoucherCode = asyncHandler(async (req, res) => {
  const { voucher_code } = req.body;
  if (!voucher_code) throw new ApiError(400, "voucher_code is required");

  const { Voucher } = await import('../../models/Voucher.js');
  const voucher = await Voucher.findOne({ code: voucher_code });
  if (!voucher) throw new ApiError(404, "Invalid voucher code");
  if (voucher.expires_at && voucher.expires_at < new Date()) throw new ApiError(400, "Voucher expired");
  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) throw new ApiError(400, "Voucher usage limit reached");

  return res.status(200).json(
    new ApiResponse(200, {
      discount: voucher.discount,
      voucher_code: voucher.code
    }, "Voucher is valid")
  );
});
