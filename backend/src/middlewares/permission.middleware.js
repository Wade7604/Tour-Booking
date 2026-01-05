const ResponseUtil = require("../utils/response.util");
const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");
const { ROLES } = require("../utils/constants");

// Check if user has specific permission
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.uid;

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        return ResponseUtil.unauthorized(res, "User not found");
      }

      // Admin has all permissions
      if (user.role === ROLES.ADMIN) {
        return next();
      }

      // Get role with permissions
      const role = await RoleModel.findByName(user.role);
      if (!role) {
        return ResponseUtil.forbidden(res, "Role not found");
      }

      // Check if user has the required permission
      if (!role.permissions.includes(requiredPermission)) {
        return ResponseUtil.forbidden(
          res,
          `You don't have permission: ${requiredPermission}`
        );
      }

      next();
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };
};

// Check if user has any of the permissions
const checkAnyPermission = (permissions = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.uid;

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        return ResponseUtil.unauthorized(res, "User not found");
      }

      // Admin has all permissions
      if (user.role === ROLES.ADMIN) {
        return next();
      }

      // Get role with permissions
      const role = await RoleModel.findByName(user.role);
      if (!role) {
        return ResponseUtil.forbidden(res, "Role not found");
      }

      // Check if user has any of the required permissions
      const hasPermission = permissions.some((perm) =>
        role.permissions.includes(perm)
      );

      if (!hasPermission) {
        return ResponseUtil.forbidden(
          res,
          `You don't have any of these permissions: ${permissions.join(", ")}`
        );
      }

      next();
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };
};

// Check if user has all permissions
const checkAllPermissions = (permissions = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.uid;

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        return ResponseUtil.unauthorized(res, "User not found");
      }

      // Admin has all permissions
      if (user.role === ROLES.ADMIN) {
        return next();
      }

      // Get role with permissions
      const role = await RoleModel.findByName(user.role);
      if (!role) {
        return ResponseUtil.forbidden(res, "Role not found");
      }

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every((perm) =>
        role.permissions.includes(perm)
      );

      if (!hasAllPermissions) {
        return ResponseUtil.forbidden(
          res,
          `You must have all of these permissions: ${permissions.join(", ")}`
        );
      }

      next();
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };
};

// Check if user has specific role
const checkRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.uid;

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        return ResponseUtil.unauthorized(res, "User not found");
      }

      // Check if user has allowed role
      if (!allowedRoles.includes(user.role)) {
        return ResponseUtil.forbidden(
          res,
          `Access denied. Required roles: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };
};

// Admin only middleware
const adminOnly = checkRole([ROLES.ADMIN]);

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRole,
  adminOnly,
};
