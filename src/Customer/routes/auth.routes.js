import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  setUserPin,
  verifyPinOtp,
  toggleBiometric,
  forgotPassword,
  verifyOtp,
  setNewPassword,
  identityCardDetails
  ,verifyProfileStatus
} from "../controllers/auth.controller.js";
//import { upload } from "../../middlewares/multer.middleware.js";
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post("/register",  registerUser);
router.post("/login", loginUser);
router.post('/refresh-token', refreshToken);
router.post("/set-pin" , authenticate, setUserPin )
router.post("/toggle-biometric" , authenticate, toggleBiometric )
router.post('/identity-card-details', authenticate,identityCardDetails); 
router.post("/verify-pin-otp" , authenticate, verifyPinOtp )
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", setNewPassword);
router.get("/verify-profile-status", authenticate, verifyProfileStatus);


export default router;