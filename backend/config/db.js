import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database Connection Error:", error.message);
    process.exit(1);
  }
}

export default connectDB;