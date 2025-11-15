import express from "express";
import cors from "cors";
import uploadRoute from "./routes/upload.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import path from "path";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// ✅ FIXED CORS configuration for local development
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder only in development
if (process.env.NODE_ENV !== 'production') {
  app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));
  console.log('Serving static files from uploads folder (development only)');
}

// Routes
app.use("/api/upload", uploadRoute);

// Basic route
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Test route to verify API is working
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!",
    success: true,
    timestamp: new Date().toISOString()
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : error.message
  });
});

// Start server with Railway-compatible configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`🌐 Network URL: http://0.0.0.0:${PORT}`);
  console.log(`✅ CORS enabled for: http://localhost:5173`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});