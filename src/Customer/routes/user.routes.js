import express from "express";
import {
  completeProfile,
  getUserAddresses,
  addNewAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  updateLanguage,
  saveUserInterests
} from "../controllers/user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Protected routes
router.use(authenticate);

router.post("/profile", upload.single("profile_picture"), completeProfile);
router.get("/addresses", getUserAddresses);
router.post("/address", addNewAddress);
router.put("/address/:id", updateAddress);
router.delete("/address/:id", deleteAddress);
router.post("/address/:id/default", setDefaultAddress);
router.post("/update-language", updateLanguage);
router.post('/interests', authenticate, saveUserInterests);


export default router;