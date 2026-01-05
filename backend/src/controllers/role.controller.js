const RoleService = require("../services/role.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class RoleController {
  // Create role
  async createRole(req, res) {
    try {
      const { name, displayName, description, permissions, isSystem } =
        req.body;

      const role = await RoleService.createRole({
        name,
        displayName,
        description,
        permissions,
        isSystem,
      });

      return ResponseUtil.created(res, role, MESSAGES.CREATED);
    } catch (error) {
      if (error.message === "Role name already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      if (error.message.includes("does not exist")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Get role by ID
  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const includePermissions = req.query.includePermissions === "true";

      const role = await RoleService.getRoleById(id, includePermissions);

      return ResponseUtil.success(res, role);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Get all roles
  async getAllRoles(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await RoleService.getAllRoles(page, limit);

      return ResponseUtil.paginate(
        res,
        result.roles,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }

  // Update role
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, displayName, description, permissions } = req.body;

      const role = await RoleService.updateRole(id, {
        name,
        displayName,
        description,
        permissions,
      });

      return ResponseUtil.success(res, role, MESSAGES.UPDATED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Role name already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      if (error.message.includes("Cannot modify system role")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes("does not exist")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Delete role
  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      await RoleService.deleteRole(id);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Cannot delete system role") {
        return ResponseUtil.forbidden(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Add permission to role
  async addPermissionToRole(req, res) {
    try {
      const { id } = req.params;
      const { permissionName } = req.body;

      const role = await RoleService.addPermissionToRole(id, permissionName);

      return ResponseUtil.success(res, role, "Permission added to role");
    } catch (error) {
      if (error.message === "Role not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("does not exist")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Remove permission from role
  async removePermissionFromRole(req, res) {
    try {
      const { id } = req.params;
      const { permissionName } = req.body;

      const role = await RoleService.removePermissionFromRole(
        id,
        permissionName
      );

      return ResponseUtil.success(res, role, "Permission removed from role");
    } catch (error) {
      if (error.message === "Role not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }
}

module.exports = new RoleController();
