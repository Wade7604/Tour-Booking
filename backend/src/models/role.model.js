const { getFirestore } = require("../config/firebase.config");
const { COLLECTIONS } = require("../config/database.config");

class RoleModel {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTIONS.ROLES);
  }

  // Tạo role mới
  async create(roleData) {
    try {
      const roleRef = this.collection.doc();
      const role = {
        id: roleRef.id,
        name: roleData.name, // e.g., "admin", "manager", "user"
        displayName: roleData.displayName, // e.g., "Administrator"
        description: roleData.description || null,
        permissions: roleData.permissions || [], // Array of permission names
        isSystem: roleData.isSystem || false, // System roles can't be deleted
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await roleRef.set(role);
      return role;
    } catch (error) {
      throw error;
    }
  }

  // Tìm role theo ID
  async findById(roleId) {
    try {
      const doc = await this.collection.doc(roleId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data();
    } catch (error) {
      throw error;
    }
  }

  // Tìm role theo name
  async findByName(name) {
    try {
      const snapshot = await this.collection
        .where("name", "==", name)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data();
    } catch (error) {
      throw error;
    }
  }

  // Get all roles
  async findAll(page = 1, limit = 50) {
    try {
      const snapshot = await this.collection.get();
      const total = snapshot.size;

      const startAt = (page - 1) * limit;
      const query = this.collection
        .orderBy("name", "asc")
        .limit(limit)
        .offset(startAt);

      const result = await query.get();
      const roles = result.docs.map((doc) => doc.data());

      return { roles, total };
    } catch (error) {
      throw error;
    }
  }

  // Update role
  async update(roleId, updateData) {
    try {
      const roleRef = this.collection.doc(roleId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await roleRef.update(updatePayload);

      const updatedDoc = await roleRef.get();
      return updatedDoc.data();
    } catch (error) {
      throw error;
    }
  }

  // Delete role
  async delete(roleId) {
    try {
      // Check if it's a system role
      const role = await this.findById(roleId);
      if (role && role.isSystem) {
        throw new Error("Cannot delete system role");
      }

      await this.collection.doc(roleId).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Add permission to role
  async addPermission(roleId, permissionName) {
    try {
      const role = await this.findById(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (!role.permissions.includes(permissionName)) {
        role.permissions.push(permissionName);
        await this.collection.doc(roleId).update({
          permissions: role.permissions,
          updatedAt: new Date().toISOString(),
        });
      }

      return role;
    } catch (error) {
      throw error;
    }
  }

  // Remove permission from role
  async removePermission(roleId, permissionName) {
    try {
      const role = await this.findById(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      role.permissions = role.permissions.filter((p) => p !== permissionName);

      await this.collection.doc(roleId).update({
        permissions: role.permissions,
        updatedAt: new Date().toISOString(),
      });

      return role;
    } catch (error) {
      throw error;
    }
  }

  // Check if role name exists
  async nameExists(name) {
    try {
      const role = await this.findByName(name);
      return role !== null;
    } catch (error) {
      throw error;
    }
  }

  // Get role with permissions details
  async findByIdWithPermissions(roleId) {
    try {
      const role = await this.findById(roleId);
      if (!role) {
        return null;
      }

      // Get permission details
      const PermissionModel = require("./permission.model");
      const permissionDetails = [];

      for (const permName of role.permissions) {
        const perm = await PermissionModel.findByName(permName);
        if (perm) {
          permissionDetails.push(perm);
        }
      }

      return {
        ...role,
        permissionDetails,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoleModel();
