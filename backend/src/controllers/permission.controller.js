const PermissionService = require("../services/permission.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class PermissionController {
  // Create permission
  async createPermission(req, res) {
    try {
      const { name, resource, action, description } = req.body;

      const permission = await PermissionService.createPermission({
        name,
        resource,
        action,
        description,
      });

      return ResponseUtil.created(res, permission, MESSAGES.CREATED);
    } catch (error) {
      if (error.message === "Permission name already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Get permission by ID
  async getPermissionById(req, res) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);

      return ResponseUtil.success(res, permission);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Get all permissions
  async getAllPermissions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await PermissionService.getAllPermissions(page, limit);

      return ResponseUtil.paginate(
        res,
        result.permissions,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }

  // Update permission
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const { name, resource, action, description } = req.body;

      const permission = await PermissionService.updatePermission(id, {
        name,
        resource,
        action,
        description,
      });

      return ResponseUtil.success(res, permission, MESSAGES.UPDATED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Permission name already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Delete permission
  async deletePermission(req, res) {
    try {
      const { id } = req.params;
      await PermissionService.deletePermission(id);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Get permissions by resource
  async getPermissionsByResource(req, res) {
    try {
      const { resource } = req.params;
      const permissions = await PermissionService.getPermissionsByResource(
        resource
      );

      return ResponseUtil.success(res, permissions);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }
}

module.exports = new PermissionController();
