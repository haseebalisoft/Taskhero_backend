import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Order } from "../../models/Order.js";
import { Cart } from "../../models/Cart.js";
import { User } from "../../models/usersmodel.js";
import { Voucher } from "../../models/Voucher.js";
import { Service } from "../../models/servicemodel.js";
//customer palce or schedule order 
// export const placeOrder = asyncHandler(async (req, res) => {
//   const { cart_id, payment_method_id, location_id, total_price, voucher_code } = req.body;
//   if (!cart_id || !payment_method_id || !location_id || !total_price) {
//     throw new ApiError(400, "Missing required fields");
//   }

//   let finalPrice = total_price;
//   let discount = 0;

//   if (voucher_code) {
//     const { Voucher } = await import('../../models/Voucher.js');
//     const voucher = await Voucher.findOne({ code: voucher_code });
//     if (!voucher) throw new ApiError(404, "Invalid voucher code");
//     if (voucher.expires_at && voucher.expires_at < new Date()) throw new ApiError(400, "Voucher expired");
//     if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) throw new ApiError(400, "Voucher usage limit reached");

//     discount = (total_price * voucher.discount) / 100;
//     finalPrice = total_price - discount;

//     voucher.used_count += 1;
//     await voucher.save();
//   }

//   // ✅ Load cart and populate services
//   const cart = await Cart.findById(cart_id).populate('items.service');
//   if (!cart) throw new ApiError(404, "Cart not found");

//   // ✅ Extract unique provider_ids
//   const providerSet = new Set();
//   for (const item of cart.items) {
//     if (item.service?.provider_id) {
//       providerSet.add(item.service.provider_id.toString());
//     }
//   }

//   const provider_ids = [...providerSet];

//   // ✅ Save provider_ids in the order
//   const order = await Order.create({
//     user: req.user.id,
//     cart: cart_id,
//     payment_method: payment_method_id,
//     location_id,
//     total_price: finalPrice,
//     voucher_code,
//     provider_ids
//   });

//   return res.status(201).json(new ApiResponse(201, {
//     order,
//     discount,
//     final_price: finalPrice
//   }, "Order placed successfully"));
// });
export const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user || !user.profileVarification) {
    return res.status(400).json({ message: "User profile is not verified." });
  }

  const {
    checkoutType,
    deliveryInfo,
    pickupInfo,
    mailInfo,
    driverInstruction,
    totalPayment, // original amount before discount
    voucherCode,
    promoCode,
    allergies,
    ScheduleInfo,
    payment_method,
    service: serviceId,
    pin
  } = req.body;

  // Check required fields
  if (!checkoutType || !totalPayment || !payment_method || !serviceId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (!pin || pin !== user.pin) {
    return res.status(400).json({ message: "Invalid PIN code." });
  }

// Step: Fetch provider using service ID
const service = await Service.findById(serviceId);
if (!service) {
  return res.status(404).json({ message: "Service not found." });
}

const providerId = service.providerUserId;
// Step: Check if provider exists 
if (!providerId) {
  return res.status(404).json({ message: "Provider not found for the service." });  
}

  // Calculate final total after discount
  let discountAmount = 0;
  let finalTotal = totalPayment;

  if (voucherCode) {
    const voucher = await Voucher.findOne({ code: voucherCode });

    if (!voucher) {
      return res.status(400).json({ message: "Invalid voucher code." });
    }

    const now = new Date();
    if (voucher.expires_at && now > voucher.expires_at) {
      return res.status(400).json({ message: "Voucher code has expired." });
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ message: "Voucher usage limit reached." });
    }

    discountAmount = (voucher.discount / 100) * totalPayment;
    finalTotal = totalPayment - discountAmount;

    // Increase used count
    voucher.used_count += 1;
    await voucher.save();
  }

  // Prepare order data
  const orderData = {
    user: userId,
    service: serviceId,
    payment_method,
    checkoutType,
    driverInstruction,
    total_price: finalTotal,
    voucherCode,
    promoCode,
    allergies,
    provider_ids: [providerId],
    confirmation: true,
   
  };

  if (checkoutType === 'delivery') {
    orderData.deliveryInfo = deliveryInfo;
  } else if (checkoutType === 'pickup') {
    orderData.pickupInfo = pickupInfo;
  } else if (checkoutType === 'mail') {
    orderData.mailInfo = mailInfo;
  } else {
    return res.status(400).json({ message: "Invalid checkout type." });
  }

  if (ScheduleInfo?.ScheduleDate && ScheduleInfo?.ScheduleTimeSlot) {
    orderData.ScheduleInfo = ScheduleInfo;
  }

  const createdOrder = await Order.create(orderData);

  res.status(201).json({
    message: "Order confirmed successfully.",
    totalBeforeDiscount: totalPayment,
    discountAmount,
    totalAfterDiscount: finalTotal,
    order: createdOrder,
  });
});


export const scheduleOrder = asyncHandler(async (req, res) => {
  const { cart_id, date, time_slot, location_id, total_price } = req.body;

  if (!cart_id || !date || !time_slot || !location_id || !total_price) {
    throw new ApiError(400, "Missing required fields");
  }

  // ✅ Fetch cart and populate services
  const cart = await Cart.findById(cart_id).populate('items.service');
  if (!cart) throw new ApiError(404, "Cart not found");

  // ✅ Extract unique provider_ids
  const providerSet = new Set();
  for (const item of cart.items) {
    if (item.service?.provider_id) {
      providerSet.add(item.service.provider_id.toString());
    }
  }
  const provider_ids = [...providerSet];

  // ✅ Create the order with provider_ids
  const order = await Order.create({
    user: req.user.id,
    cart: cart_id,
    location_id,
    date,
    time_slot,
    status: "scheduled",
    total_price,
    provider_ids // ✅ Add this line
  });

  return res.status(201).json(new ApiResponse(201, order, "Order scheduled successfully"));
});
export const orderConfirmation = asyncHandler(async (req, res) => {
  const { order_id } = req.query; // ✅ changed from req.query to body

  if (!order_id) {
    throw new ApiError(400, "order_id is required");
  }

  const order = await Order.findById(order_id)
    .populate("user")
    .populate({
      path: "cart",
      populate: {
        path: "items.service"
      }
    })
    .populate("payment_method");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res.status(200).json(new ApiResponse(200, order, "Order confirmation fetched successfully"));
});

//get all orders

export const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user_id = req.user.id;

  const query = { user: user_id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate("payment_method")
    .populate({
      path: "cart",
      populate: {
        path: "items.service"
      }
    });

  return res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

// Get Order Details
export const getOrderDetails = asyncHandler(async (req, res) => {
  const { order_id } = req.params;

  const order = await Order.findById(order_id)
    .populate("user")
    .populate({
      path: "cart",
      populate: {
        path: "items.service"
      }
    })
    .populate("payment_method");

  if (!order) throw new ApiError(404, "Order not found");

  return res.status(200).json(new ApiResponse(200, order, "Order details fetched"));
});

// Get Order Tracking Info (Mock)
export const getOrderTracking = asyncHandler(async (req, res) => {
  const { order_id } = req.params;

  const order = await Order.findById(order_id);
  if (!order) throw new ApiError(404, "Order not found");

  // Mock tracking info
  const trackingInfo = {
    order_id,
    status: order.status,
    estimated_delivery: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
    current_location: "Dispatch Center"
  };

  return res.status(200).json(new ApiResponse(200, trackingInfo, "Order tracking info"));
});

// Post QR Code
export const postQrCode = asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const { qr_data } = req.body;

  if (!qr_data) throw new ApiError(400, "qr_data is required");

  const order = await Order.findById(order_id);
  if (!order) throw new ApiError(404, "Order not found");

  order.qr_data = qr_data;
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "QR code saved"));
});

// Rate Order
export const rateOrder = asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const { rating, feedback } = req.body;
  // user_id is fetched from req.user, which should be set by the authenticate middleware
  const user_id = req.user && req.user.id ? req.user.id.toString() : null;

  if (!user_id || !rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Valid user and rating (1-5) are required");
  }

  const order = await Order.findById(order_id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user.toString() !== user_id) {
    throw new ApiError(403, "Unauthorized to rate this order");
  }

  order.rating = rating;
  order.feedback = feedback;
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Thank you for your rating"));
});

// Reorder
export const reorder = asyncHandler(async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) throw new ApiError(400, "Order ID is required");

  const user_id = req.user?.id?.toString();
  if (!user_id) throw new ApiError(401, "Unauthorized user");

  // ✅ Find the previous order and populate services inside cart items
  const previousOrder = await Order.findOne({ _id: order_id, user: user_id })
    .populate({
      path: "cart",
      populate: {
        path: "items.service",
        model: "Service"
      }
    });

  if (!previousOrder) {
    throw new ApiError(404, "Previous order not found");
  }

  if (!previousOrder.cart || !Array.isArray(previousOrder.cart.items) || previousOrder.cart.items.length === 0) {
    throw new ApiError(400, "Previous order cart is empty or invalid");
  }

  // ✅ Extract unique provider_ids from cart items
  const providerSet = new Set();
  for (const item of previousOrder.cart.items) {
    if (item.service?.provider_id) {
      providerSet.add(item.service.provider_id.toString());
    }
  }
  const provider_ids = [...providerSet];

  // ✅ Clone cart items
  const clonedItems = previousOrder.cart.items.map(item => ({
    service: item.service._id,
    quantity: item.quantity,
    schedule_time: item.schedule_time
  }));

  // ✅ Create or update user's cart
  let cart = await Cart.findOne({ user: user_id });

  if (cart) {
    cart.items = clonedItems;
    await cart.save();
  } else {
    cart = await Cart.create({
      user: user_id,
      items: clonedItems
    });
  }

  // ✅ Create new order with provider_ids
  const newOrder = await Order.create({
    user: user_id,
    cart: cart._id,
    location_id: previousOrder.location_id,
    payment_method: previousOrder.payment_method,
    total_price: previousOrder.total_price || 0,
    voucher_code: previousOrder.voucher_code,
    status: previousOrder.status || 'scheduled',
    provider_ids // ✅ Add provider_ids here
  });

  return res.status(201).json(
    new ApiResponse(201, newOrder, "Reorder placed successfully")
  );
});


