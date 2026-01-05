const express = require("express");
const router = express.Router();
const RoleController = require("../controllers/role.controller");
const { authenticateUser } = require("../middlewares/auth.middleware");
const { checkPermission } = require("../middlewares/permission.middleware");
const { PERMISSIONS } = require("../utils/constants");

// All routes require authentication
router.use(authenticateUser);

// GET /api/roles - Get all roles
router.get(
  "/",
  checkPermission(PERMISSIONS.ROLE_VIEW),
  RoleController.getAllRoles
);

// GET /api/roles/:id - Get role by ID
router.get(
  "/:id",
  checkPermission(PERMISSIONS.ROLE_VIEW),
  RoleController.getRoleById
);

// POST /api/roles - Create new role
router.post(
  "/",
  checkPermission(PERMISSIONS.ROLE_CREATE),
  RoleController.createRole
);

// PUT /api/roles/:id - Update role
router.put(
  "/:id",
  checkPermission(PERMISSIONS.ROLE_UPDATE),
  RoleController.updateRole
);

// DELETE /api/roles/:id - Delete role
router.delete(
  "/:id",
  checkPermission(PERMISSIONS.ROLE_DELETE),
  RoleController.deleteRole
);

// POST /api/roles/:id/permissions - Add permission to role
router.post(
  "/:id/permissions",
  checkPermission(PERMISSIONS.ROLE_UPDATE),
  RoleController.addPermissionToRole
);

// DELETE /api/roles/:id/permissions - Remove permission from role
router.delete(
  "/:id/permissions",
  checkPermission(PERMISSIONS.ROLE_UPDATE),
  RoleController.removePermissionFromRole
);

module.exports = router;
