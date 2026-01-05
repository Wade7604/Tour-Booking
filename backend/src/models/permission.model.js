const { getFirestore } = require("../config/firebase.config");
const { COLLECTIONS } = require("../config/database.config");

class PermissionModel {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTIONS.PERMISSIONS);
  }

  // Tạo permission mới
  async create(permissionData) {
    try {
      const permissionRef = this.collection.doc();
      const permission = {
        id: permissionRef.id,
        name: permissionData.name, // e.g., "user:create"
        resource: permissionData.resource, // e.g., "user"
        action: permissionData.action, // e.g., "create"
        description: permissionData.description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await permissionRef.set(permission);
      return permission;
    } catch (error) {
      throw error;
    }
  }

  // Tìm permission theo ID
  async findById(permissionId) {
    try {
      const doc = await this.collection.doc(permissionId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data();
    } catch (error) {
      throw error;
    }
  }

  // Tìm permission theo name
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

  // Get all permissions
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
      const permissions = result.docs.map((doc) => doc.data());

      return { permissions, total };
    } catch (error) {
      throw error;
    }
  }

  // Update permission
  async update(permissionId, updateData) {
    try {
      const permissionRef = this.collection.doc(permissionId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await permissionRef.update(updatePayload);

      const updatedDoc = await permissionRef.get();
      return updatedDoc.data();
    } catch (error) {
      throw error;
    }
  }

  // Delete permission
  async delete(permissionId) {
    try {
      await this.collection.doc(permissionId).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Check if permission name exists
  async nameExists(name) {
    try {
      const permission = await this.findByName(name);
      return permission !== null;
    } catch (error) {
      throw error;
    }
  }

  // Get permissions by resource
  async findByResource(resource) {
    try {
      const snapshot = await this.collection
        .where("resource", "==", resource)
        .orderBy("action", "asc")
        .get();

      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PermissionModel();
