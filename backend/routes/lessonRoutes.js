import express from "express";
import {
  getLessons,
  getLesson,
} from "../controllers/lessonController.js";

const router = express.Router();

router.get("/", getLessons);

router.get("/:id", getLesson);

export default router;