import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    scenario: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    vocabulary: [
      {
        french: String,
        english: String,
      },
    ],

    dialogue: [
      {
        speaker: String,
        french: String,
        english: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;