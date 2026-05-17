require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes      = require("./routes/authRoutes");
const queueRoutes     = require("./routes/queueRoutes");
const slotRoutes      = require("./routes/slotRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { startSnapshotTimer } = require("./services/snapshotService"); // ← NEW

dotenv.config();

const app = express();

// connect database
connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("Smart Canteen Backend is Running");
});

app.use("/api/auth",      authRoutes);
app.use("/api/queue",     queueRoutes);
app.use("/api/slots",     slotRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startSnapshotTimer(); // ← starts saving real data every hour
});