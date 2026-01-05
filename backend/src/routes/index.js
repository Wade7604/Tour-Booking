const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./auth.routes");
const permissionRoutes = require("./permission.routes");
const roleRoutes = require("./role.routes");
const userRoutes = require("./user.routes");
// API routes
router.use("/auth", authRoutes);
router.use("/permissions", permissionRoutes);
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
