const express = require("express");
const router = express.Router();
const PermissionController = require("../controllers/permission.controller");
const { authenticateUser } = require("../middlewares/auth.middleware");
const { adminOnly } = require("../middlewares/permission.middleware");

// All routes require authentication and admin role
router.use(authenticateUser);
router.use(adminOnly);

// GET /api/permissions - Get all permissions
router.get("/", PermissionController.getAllPermissions);

// GET /api/permissions/:id - Get permission by ID
router.get("/:id", PermissionController.getPermissionById);

// GET /api/permissions/resource/:resource - Get permissions by resource
router.get(
  "/resource/:resource",
  PermissionController.getPermissionsByResource
);

// POST /api/permissions - Create new permission
router.post("/", PermissionController.createPermission);

// PUT /api/permissions/:id - Update permission
router.put("/:id", PermissionController.updatePermission);

// DELETE /api/permissions/:id - Delete permission
router.delete("/:id", PermissionController.deletePermission);

module.exports = router;
