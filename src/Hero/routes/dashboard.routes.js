import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getDashboard, getScheduledTasks } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/v1/dashboard", authenticate, getDashboard);
router.get("/v1/scheduled-tasks", authenticate, getScheduledTasks);

export default router; 