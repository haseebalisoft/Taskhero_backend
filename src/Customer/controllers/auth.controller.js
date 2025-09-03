import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/usersmodel.js";
import jwt from "jsonwebtoken";
import  AuthToken from "../../models/authmodel.js";
import crypto from "crypto";
import { sendEmail } from "../../utils/emailService.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {sendOtpToMobile} from '../../utils/sendOtpToMobile.js'
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashedPassword
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});


const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingRefreshToken } = req.body;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  let decoded;
  try {
    // Decode first without verifying to check expiry separately
    decoded = jwt.decode(incomingRefreshToken);

    if (!decoded) {
      throw new ApiError(401, "Malformed refresh token");
    }

    // Expiry check before verification
    if (decoded.exp * 1000 < Date.now()) {
      throw new ApiError(401, "Refresh token has expired");
    }

    // Now verify the signature
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Check user existence
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Match against stored refresh token in DB
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token does not match latest session");
  }

  // Generate new access and refresh tokens (rotation)
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // Update DB with new refresh token
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  // Return both tokens
  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      "Tokens refreshed successfully"
    )
  );
});



const setUserPin = asyncHandler(async (req, res) => {
  const  userId  = req.user.id; // assuming user is already logged in (auth middleware)
  const { pin } = req.body;

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new ApiError(400, "PIN must be a 4-digit number");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString("hex");

  // Store in your AuthToken collection
  await AuthToken.create({
    user_id: user._id,
    token,
    otp,
    type: "pin_verification",
    expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  });

  await sendEmail(user.email, "Verify your PIN setup", `Your OTP is: ${otp}`);

  // Temporarily store PIN in memory or a secure pending table (or cache)
  user.pin = pin; // or you can temporarily cache this value until OTP is verified
  user.isPinVerified = false;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, null, "OTP sent to email. Verify to activate PIN.")
  );
});

const verifyPinOtp = asyncHandler(async (req, res) => {
  const  userId  = req.user.id;
  const { otp } = req.body;

  const tokenEntry = await AuthToken.findOne({
    user_id: userId,
    otp,
    type: "pin_verification",
    expires_at: { $gt: new Date() }
  });

  if (!tokenEntry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // OTP verified - mark PIN as active
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.isPinVerified = true;
  await user.save();

  // Clean up OTP token
  await AuthToken.deleteMany({ user_id: userId, type: "pin_verification" });

  return res.status(200).json(
    new ApiResponse(200, null, "PIN activated successfully")
  );
});

const toggleBiometric = asyncHandler(async (req, res) => {
  const  userId  = req.user.id; // assuming user is authenticated
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    throw new ApiError(400, "Enabled must be a boolean (true or false)");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.biometric_enabled = enabled;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { biometricEnabled: user.biometric_enabled },
      `Biometric authentication has been ${enabled ? "enabled" : "disabled"}`
    )
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email ,phone } = req.body;
  if(phone){
    return sendMobile(phone)
  }

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  await AuthToken.create({
    user_id: user._id,
    otp,
    type: "password_reset",
    expires_at: new Date(Date.now() + 15 * 60 * 1000),
    verified: false
  });

  await sendEmail(email, "Reset Password OTP", `Your OTP is: ${otp}`);

  return res.status(200).json(
    new ApiResponse(200, {}, "OTP sent to email")
  );
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, phone, otp } = req.body;
  if(phone){
    return verifyMobileOtp(phone,otp);
  }

  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const tokenEntry = await AuthToken.findOne({
    user_id: user._id,
    otp,
    type: "password_reset",
    expires_at: { $gt: new Date() }
  });

  if (!tokenEntry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  tokenEntry.verified = true;
  await tokenEntry.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "OTP verified successfully")
  );
});

const setNewPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    throw new ApiError(400, "Email and new password are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const verifiedToken = await AuthToken.findOne({
    user_id: user._id,
    type: "password_reset",
    verified: true,
    expires_at: { $gt: new Date() }
  });

  if (!verifiedToken) {
    throw new ApiError(403, "OTP not verified or session expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  // Cleanup all related tokens
  await AuthToken.deleteMany({ user_id: user._id, type: "password_reset" });

  return res.status(200).json(
    new ApiResponse(200, {}, "Password updated successfully")
  );
});

const sendMobile = async(phone) => {
  if (!phone) throw new ApiError(400, "Phone number is required");

  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(404, "User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const smsSent = await sendOtpToMobile(phone, otp);
  if (!smsSent) throw new ApiError(500, "Failed to send OTP");

  await AuthToken.create({
    user_id: user._id,
    otp,
    type: "password-reset",
    expires_at: new Date(Date.now() + 15 * 60 * 1000),
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "OTP sent to mobile number")
  );
};
const verifyMobileOtp = async (phone,otp) => {

  if (!phone || !otp) throw new ApiError(400, "Phone and OTP are required");

  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(404, "User not found");

  const tokenEntry = await AuthToken.findOne({
    user_id: user._id,
    otp,
    type: "mobile_verification",
    expires_at: { $gt: new Date() }
  });

  if (!tokenEntry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  tokenEntry.verified = true;
  await tokenEntry.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Mobile OTP verified successfully")
  );
};


const identityCardDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const {
    identityNumber,
    name,
    dob,
    religion,
    marital,
    nationality,
    expiredDate
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Add or update IdentityCard details
  user.IdentityCard = {
    identityNumber,
    name,
    dob,
    religion,
    marital,
    nationality,
    expiredDate
  };

  await user.save();

  res.status(200).json(
    new ApiResponse(200, { IdentityCard: user.IdentityCard }, "Identity card details saved successfully")
  );
});


 const verifyProfileStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { isPinVerified, biometric_enabled, IdentityCard } = user;

  // Check IdentityCard completeness
  const hasValidIdentityCard =
    IdentityCard &&
    IdentityCard.identityNumber &&
    IdentityCard.name &&
    IdentityCard.dob ||
    IdentityCard.religion ||
    IdentityCard.marital ||
    IdentityCard.nationality ||
    IdentityCard.expiredDate;

  const isProfileVerified =
    isPinVerified === true &&
    biometric_enabled === true &&
    !!hasValidIdentityCard;

    console.log(isProfileVerified);

  user.profileVarification = isProfileVerified;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {profileVarification: user.profileVarification }, "Profile verification status updated")
  );
});



export {
  registerUser,
  loginUser,
  refreshToken,
  setUserPin,
  verifyPinOtp,
  toggleBiometric,
  forgotPassword,
  verifyOtp,
  setNewPassword,
  identityCardDetails,
  verifyProfileStatus
 
};