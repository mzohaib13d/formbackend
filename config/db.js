import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Use MONGODB_URI (what you set in Railway) instead of MONGO_URI
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error("❌ MongoDB URI is missing. Check environment variables.");
      return; // Don't crash the app
    }
    
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // Remove process.exit(1) for Railway
  }
};

export default connectDB;