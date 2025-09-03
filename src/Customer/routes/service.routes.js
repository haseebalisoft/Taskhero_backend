import express from "express";
import {
  getHomeDashboard,
  getServicesByCategory,
  searchServices,
  getAllCategories,
  getSubcategories,
  getServicesBySubcategory,
  getServiceDetails,
  sortOrFilterServices,
  getPremiumServicesInfo
} from "../controllers/service.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Mixed routes (some public, some protected)
router.get("/dashboard", authenticate, getHomeDashboard);
router.get("/categories", getAllCategories);
router.get("/categories/:category_id/subcategories", getSubcategories);
router.get("/services", getServicesByCategory); // Public
router.get("/services/search", searchServices); // Public
router.get("/services/:service_id", getServiceDetails); // Public
router.get("/services/filter", sortOrFilterServices); // Public  //error
router.get("/subscription/plans", authenticate, getPremiumServicesInfo); //404 error

export default router;