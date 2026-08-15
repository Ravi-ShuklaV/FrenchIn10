import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  getReview,
  addReview,
  getDueReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", protect, getReview);
router.get("/due", protect, getDueReviews);
router.post("/", protect, addReview);

export default router;