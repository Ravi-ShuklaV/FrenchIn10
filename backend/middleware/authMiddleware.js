import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function protect(req, res, next) {
  try {
    console.log("\n========== AUTH MIDDLEWARE ==========");
    console.log("Authorization Header:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Authorization Header");

      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("Token:", token);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Decoded Token:", decoded);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ User not found");

      return res.status(401).json({
        message: "User not found",
      });
    }

    console.log("✅ User:", user.email);

    req.user = user;

    next();
  } catch (error) {
    console.log("❌ JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
}

export default protect;