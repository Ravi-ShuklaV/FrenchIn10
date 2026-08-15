import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
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

    totalQuestions: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    incorrectAnswers: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    skillStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    weakConcepts: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Progress", progressSchema);