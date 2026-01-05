const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const { authenticateUser } = require("../middlewares/auth.middleware");
const {
  checkPermission,
  adminOnly,
} = require("../middlewares/permission.middleware");

// All routes require authentication
router.use(authenticateUser);

// ✅ THÊM: Elasticsearch health check
router.get(
  "/elasticsearch/health",
  checkPermission("user:view"),
  UserController.checkElasticsearchHealth
);

// ✅ THÊM: Reindex all users (admin only)
router.post(
  "/elasticsearch/reindex",
  adminOnly,
  UserController.reindexAllUsers
);

// ✅ THÊM: Get user statistics
router.get(
  "/statistics",
  checkPermission("user:view"),
  UserController.getUserStatistics
);

// GET /api/users/search - Search users (đã có, giữ nguyên)
router.get("/search", checkPermission("user:view"), UserController.searchUsers);

// GET /api/users/role/:role - Get users by role
router.get(
  "/role/:role",
  checkPermission("user:view"),
  UserController.getUsersByRole
);

// GET /api/users - Get all users
router.get("/", checkPermission("user:view"), UserController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get("/:id", checkPermission("user:view"), UserController.getUserById);

// POST /api/users - Create new user
router.post("/", checkPermission("user:create"), UserController.createUser);

// PUT /api/users/:id - Update user
router.put("/:id", checkPermission("user:update"), UserController.updateUser);

// PATCH /api/users/:id/status - Update user status
router.patch(
  "/:id/status",
  checkPermission("user:update"),
  UserController.updateUserStatus
);

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch("/:id/role", adminOnly, UserController.updateUserRole);

// ✅ THÊM: Reindex một user
router.post(
  "/:id/reindex",
  checkPermission("user:update"),
  UserController.reindexUser
);

// DELETE /api/users/:id - Delete user
router.delete(
  "/:id",
  checkPermission("user:delete"),
  UserController.deleteUser
);

module.exports = router;
