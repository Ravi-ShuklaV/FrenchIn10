import express from "express";
import multer from "multer";

import protect from "../middleware/authMiddleware.js";

import {
  chatWithAI,
  analyzeHandwritingController,
} from "../controllers/aiController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =========================
// AI CHAT
// =========================

router.post(
  "/chat",
  protect,
  chatWithAI
);

// =========================
// HANDWRITING
// =========================

router.post(
  "/handwriting",
  protect,
  upload.single("image"),
  analyzeHandwritingController
);

export default router;