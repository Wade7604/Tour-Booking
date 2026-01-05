const { getFirestore } = require("../config/firebase.config");
const { COLLECTIONS } = require("../config/database.config");
const { ROLES, USER_STATUS } = require("../utils/constants");
const ElasticsearchService = require("../services/elasticsearch.service");

class UserModel {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTIONS.USERS);
  }

  // Tạo hoặc update user từ Firebase Auth
  async createOrUpdate(uid, userData) {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      let user;

      if (doc.exists) {
        // User đã tồn tại, update thông tin
        const updateData = {
          email: userData.email,
          fullName: userData.fullName || doc.data().fullName,
          avatar: userData.avatar || doc.data().avatar,
          updatedAt: new Date().toISOString(),
        };
        await userRef.update(updateData);
        user = { ...doc.data(), ...updateData };
      } else {
        // User mới, tạo mới
        const newUser = {
          id: uid,
          email: userData.email,
          fullName: userData.fullName,
          phone: userData.phone || null,
          avatar: userData.avatar || null,
          role: userData.role || ROLES.USER,
          status: userData.status || USER_STATUS.ACTIVE,
          provider: userData.provider || "google",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await userRef.set(newUser);
        user = newUser;
      }

      // ✅ Index to Elasticsearch
      try {
        await ElasticsearchService.indexUser(user);
      } catch (esError) {
        console.error("Failed to index user to ES:", esError);
        // Don't throw error, continue with Firestore operation
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Create new user (for admin)
  async create(userData) {
    try {
      const userRef = this.collection.doc();
      const userId = userRef.id;

      const newUser = {
        id: userId,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone || null,
        avatar: userData.avatar || null,
        role: userData.role || ROLES.USER,
        status: userData.status || USER_STATUS.ACTIVE,
        provider: userData.provider || "email",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRef.set(newUser);

      // ✅ Index to Elasticsearch
      try {
        await ElasticsearchService.indexUser(newUser);
      } catch (esError) {
        console.error("Failed to index user to ES:", esError);
      }

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  // Tìm user theo email
  async findByEmail(email) {
    try {
      const snapshot = await this.collection
        .where("email", "==", email)
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

  // Tìm user theo ID (Firebase UID)
  async findById(userId) {
    try {
      const doc = await this.collection.doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data();
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(userId, updateData) {
    try {
      const userRef = this.collection.doc(userId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await userRef.update(updatePayload);

      const updatedDoc = await userRef.get();
      const user = updatedDoc.data();

      // ✅ Update in Elasticsearch
      try {
        await ElasticsearchService.updateUser(userId, updatePayload);
      } catch (esError) {
        console.error("Failed to update user in ES:", esError);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async delete(userId) {
    try {
      await this.collection.doc(userId).delete();

      // ✅ Delete from Elasticsearch
      try {
        await ElasticsearchService.deleteUser(userId);
      } catch (esError) {
        console.error("Failed to delete user from ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      let query = this.collection;

      // Apply filters
      if (filters.role) {
        query = query.where("role", "==", filters.role);
      }
      if (filters.status) {
        query = query.where("status", "==", filters.status);
      }

      // Count total
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAt = (page - 1) * limit;
      const paginatedQuery = query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(startAt);

      const result = await paginatedQuery.get();
      const users = result.docs.map((doc) => doc.data());

      return { users, total };
    } catch (error) {
      throw error;
    }
  }

  // Find users by role with pagination
  async findByRole(roleName, page = 1, limit = 10) {
    try {
      const query = this.collection.where("role", "==", roleName);

      // Count total
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAt = (page - 1) * limit;
      const paginatedQuery = query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(startAt);

      const result = await paginatedQuery.get();
      const users = result.docs.map((doc) => doc.data());

      return { users, total };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Search users using Elasticsearch
  async search(searchTerm, page = 1, limit = 10, filters = {}) {
    try {
      // Use Elasticsearch for search
      return await ElasticsearchService.searchUsers(
        searchTerm,
        page,
        limit,
        filters
      );
    } catch (error) {
      console.error("Elasticsearch search failed, falling back to Firestore");

      // Fallback to Firestore if ES fails
      const snapshot = await this.collection.orderBy("createdAt", "desc").get();

      const searchLower = searchTerm.toLowerCase();
      const filteredUsers = snapshot.docs
        .map((doc) => doc.data())
        .filter((user) => {
          const fullNameMatch = user.fullName
            ?.toLowerCase()
            .includes(searchLower);
          const emailMatch = user.email?.toLowerCase().includes(searchLower);

          let matchesFilters = true;
          if (filters.role && user.role !== filters.role)
            matchesFilters = false;
          if (filters.status && user.status !== filters.status)
            matchesFilters = false;

          return (fullNameMatch || emailMatch) && matchesFilters;
        });

      const total = filteredUsers.length;
      const startAt = (page - 1) * limit;
      const users = filteredUsers.slice(startAt, startAt + limit);

      return { users, total };
    }
  }

  // Check if email exists
  async emailExists(email) {
    try {
      const user = await this.findByEmail(email);
      return user !== null;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get user statistics using Elasticsearch
  async getStatistics() {
    try {
      return await ElasticsearchService.getUserAggregations();
    } catch (error) {
      console.error("Failed to get stats from ES, using Firestore");

      // Fallback to Firestore
      const snapshot = await this.collection.get();
      const users = snapshot.docs.map((doc) => doc.data());

      const stats = {
        total: users.length,
        byRole: {},
        byStatus: {},
        byProvider: {},
      };

      users.forEach((user) => {
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        stats.byStatus[user.status] = (stats.byStatus[user.status] || 0) + 1;
        stats.byProvider[user.provider] =
          (stats.byProvider[user.provider] || 0) + 1;
      });

      return stats;
    }
  }

  // Batch update users
  async batchUpdate(userIds, updateData) {
    try {
      const batch = this.db.batch();
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      userIds.forEach((userId) => {
        const userRef = this.collection.doc(userId);
        batch.update(userRef, updatePayload);
      });

      await batch.commit();

      // ✅ Update in Elasticsearch
      try {
        for (const userId of userIds) {
          await ElasticsearchService.updateUser(userId, updatePayload);
        }
      } catch (esError) {
        console.error("Failed to batch update users in ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Batch delete users
  async batchDelete(userIds) {
    try {
      const batch = this.db.batch();

      userIds.forEach((userId) => {
        const userRef = this.collection.doc(userId);
        batch.delete(userRef);
      });

      await batch.commit();

      // ✅ Delete from Elasticsearch
      try {
        for (const userId of userIds) {
          await ElasticsearchService.deleteUser(userId);
        }
      } catch (esError) {
        console.error("Failed to batch delete users from ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserModel();
