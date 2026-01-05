const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");
const { MESSAGES, USER_STATUS } = require("../utils/constants");

class UserService {
  // Create new user
  async createUser(userData) {
    try {
      // Check if email already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Validate role exists
      if (userData.role) {
        const role = await RoleModel.findByName(userData.role);
        if (!role) {
          throw new Error(`Role '${userData.role}' does not exist`);
        }
      }

      const user = await UserModel.create(userData);
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  async getAllUsers(page, limit, filters = {}) {
    try {
      const result = await UserModel.findAll(page, limit, filters);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // If updating email, check if new email already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await UserModel.findByEmail(updateData.email);
        if (existingUser) {
          throw new Error("Email already exists");
        }
      }

      // Validate role exists if updating role
      if (updateData.role) {
        const role = await RoleModel.findByName(updateData.role);
        if (!role) {
          throw new Error(`Role '${updateData.role}' does not exist`);
        }
      }

      const updatedUser = await UserModel.update(userId, updateData);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      await UserModel.delete(userId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId, status) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Validate status
      const validStatuses = Object.values(USER_STATUS);
      if (!validStatuses.includes(status)) {
        throw new Error(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        );
      }

      const updatedUser = await UserModel.update(userId, { status });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Update user role
  async updateUserRole(userId, roleName) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Validate role exists
      const role = await RoleModel.findByName(roleName);
      if (!role) {
        throw new Error(`Role '${roleName}' does not exist`);
      }

      const updatedUser = await UserModel.update(userId, { role: roleName });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(roleName, page, limit) {
    try {
      const result = await UserModel.findByRole(roleName, page, limit);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm, page, limit, filters = {}) {
    try {
      const result = await UserModel.search(searchTerm, page, limit, filters);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // ✅ THÊM: Get user statistics
  async getUserStatistics() {
    try {
      return await UserModel.getStatistics();
    } catch (error) {
      throw error;
    }
  }

  // ✅ THÊM: Reindex một user (nếu ES bị lỗi)
  async reindexUser(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      const ElasticsearchService = require("./elasticsearch.service");
      await ElasticsearchService.indexUser(user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // ✅ THÊM: Batch reindex all users
  async reindexAllUsers() {
    try {
      const snapshot = await UserModel.collection.get();
      const users = snapshot.docs.map((doc) => doc.data());

      const ElasticsearchService = require("./elasticsearch.service");
      await ElasticsearchService.bulkIndexUsers(users);

      return {
        total: users.length,
        message: "All users reindexed successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
