import express from "express";
import {
  fetchLocationFromMap,
  reverseGeocode
} from "../controllers/location.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Protected routes
router.use(authenticate);

router.get("/search", fetchLocationFromMap);
router.get("/reverse-geocode", reverseGeocode);

export default router;