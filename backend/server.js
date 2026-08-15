import express from "express";

import cors from "cors";

import progressRoutes from "./routes/progressRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import reviewRoutes from "./routes/reviewRoutes.js";
import connectDB from "./config/db.js";

import lessonRoutes from "./routes/lessonRoutes.js";

import "dotenv/config"

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/ai", aiRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "FrenchIn10 Backend Running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});