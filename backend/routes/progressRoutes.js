import express from "express";

import {
  saveProgress,
  getProgress,
} from "../controllers/progressController.js";

import protect from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, saveProgress);
router.get("/", protect, getProgress);

export default router;