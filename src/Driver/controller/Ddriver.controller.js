import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/usersmodel.js';
import { Task } from '../../models/Task.js';
import { Driver } from '../../models/Driver.js';
import { ChatMessage } from '../../models/ChatMessage.js';
import {ApiError} from '../../utils/ApiError.js';
import {ApiResponse} from '../../utils/ApiResponse.js';
import {PaymentMethod} from '../../models/PaymentMethod.js'
import bcrypt from 'bcryptjs';

export const registerDriver = asyncHandler(async (req, res) => {
    const {  email,  password  } = req.body;
    // Check if user already exists with email
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, 'Email already registered');
    // Hash the password
    const hashed = await bcrypt.hash(password, 10);
  
    // Create user
    const user = await User.create({
      email,
      password: hashed,
    });
  
    // Create driver profile linked to user
    const driver = await Driver.create({
      user: user._id,
     
    });
  
    return res.status(201).json(new ApiResponse(201, { user, driver }, 'Driver registered'));
});
  
export const loginDriver = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const driver = await Driver.findOne({ user: user._id });
  if (!driver) throw new ApiError(403, 'Not registered as a driver');

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  return res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, driver }, 'Login successful'));
});

export const profile = asyncHandler(async (req, res) => {
  const {  fullName, languages, phone, location } = req.body;
  const userId = req.user.id; // assuming you're using authentication middleware


  // 1. Check User
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // 2. Check Driver
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    return res.status(404).json({ success: false, message: "Driver not found" });
  }
  const driverImage = req.files?.driverImage?.map(file =>
    `public/uploads/driver/${file.filename}`
  ) || [];
  console.log(driverImage)
  // 3. Update User
  user.fullName = fullName || user.fullName;
  user.language = languages || user.language;
  user.phone = phone || user.phone;
  user.location = location || user.location;
  user.profile_picture = driverImage.length > 0 ? driverImage[0] : user.profile_picture;  // Update profile picture if provided

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user
  });
});

export const addpaymentmethod=asyncHandler(async(req,res)=>{
  try {
    const userId = req.user.id;

    const payment = new PaymentMethod({
      user: userId,
      ...req.body
    });

    await payment.save();

    await Driver.findByIdAndUpdate(userId, {
      $addToSet: { paymentMethods: payment._id }
    });

    res.status(201).json({
      success: true,
      message: "Payment method added",
      data: payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export const vehicledetails = asyncHandler(async (req, res) => {
  const { vehicleType, registrationNumber, modelYear } = req.body;
  const userId = req.user.id;

  // Find the driver linked to the logged-in user
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    return res.status(404).json({ success: false, message: "Driver not found" });
  }

  // Upload images
  const vehicleImages = req.files?.vehicleImages.map(file =>
    `public/uploads/vehicleImages/${file.filename}`
  ) || [];

  // Update fields only if provided
  if (vehicleType) driver.vehicleType = vehicleType;
  if (registrationNumber) driver.registrationNumber = registrationNumber;
  if (modelYear) driver.modelYear = modelYear;
  if (vehicleImages) driver.vehicleImages = vehicleImages.length > 0 ? vehicleImages[0] : driver.vehicleImages; // Update vehicle images if provided    

  await driver.save();

  res.status(200).json({
    success: true,
    message: "Driver profile updated successfully",
    driver
  });
});

export const vehicledocuments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find the driver linked to the logged-in user
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    return res.status(404).json({ success: false, message: "Driver not found" });
  }

  // Upload images
  const RightToWork = req.files?.RightToWork?.map(file =>
    `public/uploads/vehicleDocuments/${file.filename}`
  ) || [];
  const identityCard = req.files?.identityCard?.map(file =>
    `public/uploads/vehicleDocuments/${file.filename}`
  ) || [];
  const drivingLicense = req.files?.drivingLicense?.map(file =>
    `public/uploads/vehicleDocuments/${file.filename}`
  ) || [];
  const vehicleLicense = req.files?.vehicleLicense?.map(file =>
    `public/uploads/vehicleDocuments/${file.filename}`
  ) || [];
  const insurranceDcouments = req.files?.insurranceDcouments?.map(file =>
    `public/uploads/vehicleDocuments/${file.filename}`
  ) || [];

  // Update fields only if provided
  if (RightToWork) driver.RightToWork = RightToWork.length > 0 ? RightToWork[0] : driver.RightToWork;
  if (identityCard) driver.identityCard = identityCard.length > 0 ? identityCard[0] : driver.identityCard;
  if (drivingLicense) driver.drivingLicense = drivingLicense.length > 0 ? drivingLicense[0] : driver.drivingLicense;
  if (vehicleLicense) driver.vehicleLicense = vehicleLicense.length > 0 ? vehicleLicense[0] : driver.vehicleLicense;
  if (insurranceDcouments) driver.insurranceDcouments = insurranceDcouments.length > 0 ? insurranceDcouments[0] : driver.insurranceDcouments;

  await driver.save();

  res.status(200).json({
    success: true,
    message: "Driver profile updated successfully",
    driver
  });
});

// 📋 Task Endpoints
export const viewTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ status: 'open' });
  return res.status(200).json(new ApiResponse(200, tasks, 'Available tasks'));
});

export const viewTaskDetail = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json(new ApiResponse(200, task, 'Task detail'));
});

export const acceptTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  task.status = 'accept';
  await task.save();
  return res.status(200).json(new ApiResponse(200, task, 'Task accepted'));
});

export const rejectTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  task.status = 'reject';
  await task.save();
  return res.status(200).json(new ApiResponse(200, task, 'Task rejected'));
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  task.status = status;
  await task.save();
  return res.status(200).json(new ApiResponse(200, task, 'Status updated'));
});

export const trackTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json(new ApiResponse(200, task.location, 'Tracking info'));
});

// 👤 Profile
export const getDriverProfile = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.id }).populate('user');
  if (!driver) throw new ApiError(404, 'Driver profile not found');
  return res.status(200).json(new ApiResponse(200, driver, 'Driver profile'));
});

export const updateDriverProfile = asyncHandler(async (req, res) => {
  const driver = await Driver.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true }
  ).populate('user');
  return res.status(200).json(new ApiResponse(200, driver, 'Profile updated'));
});

// 💬 Messaging
export const getChatMessages = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ thread: req.params.orderId });
  return res.status(200).json(new ApiResponse(200, messages, 'Chat messages'));
});

export const sendChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const newMessage = await ChatMessage.create({
    thread: req.params.orderId,
    sender: req.user.id,
    receiver: req.body.receiver,
    message,
  });
  return res.status(201).json(new ApiResponse(201, newMessage, 'Message sent'));
});

// 🔔 Notifications (placeholder)
export const getNotifications = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, [], 'Notifications fetched'));
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, null, 'Notifications marked as read'));
});
