const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");

const app = express();
const server = require("http").createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost",
"http://20.2.139.220",
  process.env.CORS_ORIGIN,
];

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bill", billRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("uploads/products")) {
  fs.mkdirSync("uploads/products", { recursive: true });
}

if (!fs.existsSync("uploads/defaults")) {
  fs.mkdirSync("uploads/defaults", { recursive: true });
}

//Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();
