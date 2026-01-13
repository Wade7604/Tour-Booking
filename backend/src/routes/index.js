const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./auth.routes");
const permissionRoutes = require("./permission.routes");
const roleRoutes = require("./role.routes");
const userRoutes = require("./user.routes");
const destinationRoutes = require("./destination.routes");
const tourRoutes = require("./tour.routes");
const uploadRoutes = require("./upload.routes");
const bookingRoutes = require("./booking.routes");

// API routes
router.use("/auth", authRoutes);
router.use("/permissions", permissionRoutes);
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/destinations", destinationRoutes);
router.use("/tours", tourRoutes);
router.use("/uploads", uploadRoutes);
router.use("/bookings", bookingRoutes);
// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
