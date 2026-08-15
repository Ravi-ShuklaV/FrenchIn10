import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lessonId: {
      type: Number,
      required: true,
    },

    conceptId: {
      type: String,
      required: true,
    },

    french: {
      type: String,
      required: true,
    },

    english: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "dialogue",
        "practice",
        "vocabulary",
        "grammar",
        "phrase",
        "speaking",
        "writing",
      ],
      required: true,
    },

    // =========================
    // REVIEW PERFORMANCE
    // =========================

    incorrectCount: {
      type: Number,
      default: 0,
    },

    correctCount: {
      type: Number,
      default: 0,
    },

    // =========================
    // SPACED REPETITION
    // =========================

    repetitions: {
      type: Number,
      default: 0,
    },

    interval: {
      type: Number,
      default: 0,
    },

    difficulty: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    lastReviewedAt: {
      type: Date,
      default: null,
    },

    nextReviewAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One review record per user + concept
reviewSchema.index(
  { user: 1, conceptId: 1 },
  { unique: true }
);

export default mongoose.model(
  "Review",
  reviewSchema
);