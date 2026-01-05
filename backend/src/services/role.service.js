const RoleModel = require("../models/role.model");
const PermissionModel = require("../models/permission.model");
const { MESSAGES } = require("../utils/constants");

class RoleService {
  // Create new role
  async createRole(roleData) {
    try {
      // Check if role name already exists
      const exists = await RoleModel.nameExists(roleData.name);
      if (exists) {
        throw new Error("Role name already exists");
      }

      // Validate permissions exist
      if (roleData.permissions && roleData.permissions.length > 0) {
        for (const permName of roleData.permissions) {
          const permission = await PermissionModel.findByName(permName);
          if (!permission) {
            throw new Error(`Permission '${permName}' does not exist`);
          }
        }
      }

      const role = await RoleModel.create(roleData);
      return role;
    } catch (error) {
      throw error;
    }
  }

  // Get role by ID
  async getRoleById(roleId, includePermissions = false) {
    try {
      let role;

      if (includePermissions) {
        role = await RoleModel.findByIdWithPermissions(roleId);
      } else {
        role = await RoleModel.findById(roleId);
      }

      if (!role) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      return role;
    } catch (error) {
      throw error;
    }
  }

  // Get all roles
  async getAllRoles(page, limit) {
    try {
      const result = await RoleModel.findAll(page, limit);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update role
  async updateRole(roleId, updateData) {
    try {
      // Check if role exists
      const role = await RoleModel.findById(roleId);
      if (!role) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check if it's a system role
      if (role.isSystem && (updateData.name || updateData.isSystem === false)) {
        throw new Error("Cannot modify system role name or system flag");
      }

      // If updating name, check if new name already exists
      if (updateData.name && updateData.name !== role.name) {
        const exists = await RoleModel.nameExists(updateData.name);
        if (exists) {
          throw new Error("Role name already exists");
        }
      }

      // Validate permissions exist
      if (updateData.permissions && updateData.permissions.length > 0) {
        for (const permName of updateData.permissions) {
          const permission = await PermissionModel.findByName(permName);
          if (!permission) {
            throw new Error(`Permission '${permName}' does not exist`);
          }
        }
      }

      const updatedRole = await RoleModel.update(roleId, updateData);
      return updatedRole;
    } catch (error) {
      throw error;
    }
  }

  // Delete role
  async deleteRole(roleId) {
    try {
      await RoleModel.delete(roleId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Add permission to role
  async addPermissionToRole(roleId, permissionName) {
    try {
      // Check if permission exists
      const permission = await PermissionModel.findByName(permissionName);
      if (!permission) {
        throw new Error(`Permission '${permissionName}' does not exist`);
      }

      const role = await RoleModel.addPermission(roleId, permissionName);
      return role;
    } catch (error) {
      throw error;
    }
  }

  // Remove permission from role
  async removePermissionFromRole(roleId, permissionName) {
    try {
      const role = await RoleModel.removePermission(roleId, permissionName);
      return role;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoleService();
