const PermissionModel = require("../models/permission.model");
const { MESSAGES } = require("../utils/constants");

class PermissionService {
  // Create new permission
  async createPermission(permissionData) {
    try {
      // Check if permission name already exists
      const exists = await PermissionModel.nameExists(permissionData.name);
      if (exists) {
        throw new Error("Permission name already exists");
      }

      const permission = await PermissionModel.create(permissionData);
      return permission;
    } catch (error) {
      throw error;
    }
  }

  // Get permission by ID
  async getPermissionById(permissionId) {
    try {
      const permission = await PermissionModel.findById(permissionId);
      if (!permission) {
        throw new Error(MESSAGES.NOT_FOUND);
      }
      return permission;
    } catch (error) {
      throw error;
    }
  }

  // Get all permissions
  async getAllPermissions(page, limit) {
    try {
      const result = await PermissionModel.findAll(page, limit);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update permission
  async updatePermission(permissionId, updateData) {
    try {
      // Check if permission exists
      const permission = await PermissionModel.findById(permissionId);
      if (!permission) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // If updating name, check if new name already exists
      if (updateData.name && updateData.name !== permission.name) {
        const exists = await PermissionModel.nameExists(updateData.name);
        if (exists) {
          throw new Error("Permission name already exists");
        }
      }

      const updatedPermission = await PermissionModel.update(
        permissionId,
        updateData
      );
      return updatedPermission;
    } catch (error) {
      throw error;
    }
  }

  // Delete permission
  async deletePermission(permissionId) {
    try {
      const permission = await PermissionModel.findById(permissionId);
      if (!permission) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      await PermissionModel.delete(permissionId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get permissions by resource
  async getPermissionsByResource(resource) {
    try {
      const permissions = await PermissionModel.findByResource(resource);
      return permissions;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PermissionService();
