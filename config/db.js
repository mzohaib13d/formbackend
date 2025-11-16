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

    console.log("🔗 Connecting to MongoDB...");

    // ✅ ADD THESE CRITICAL OPTIONS TO PREVENT TIMEOUTS
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: 30000,        // 30 seconds
      connectTimeoutMS: 30000,       // 30 seconds  
      serverSelectionTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,               // Maximum connections
      retryWrites: true,
      w: 'majority'
    };
    
    await mongoose.connect(mongoURI, options);
    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // Remove process.exit(1) for Railway
  }
};

export default connectDB;