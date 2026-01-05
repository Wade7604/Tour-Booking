const UserService = require("../services/user.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class UserController {
  // Create user
  createUser = async (req, res) => {
    try {
      const { email, fullName, phone, role, status, avatar } = req.body;

      const user = await UserService.createUser({
        email,
        fullName,
        phone,
        role,
        status,
        avatar,
      });

      return ResponseUtil.created(res, user, MESSAGES.CREATED);
    } catch (error) {
      if (error.message === "Email already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      if (error.message.includes("does not exist")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get user by ID
  getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      return ResponseUtil.success(res, user);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get all users
  getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Optional filters
      const filters = {};
      if (req.query.role) filters.role = req.query.role;
      if (req.query.status) filters.status = req.query.status;

      const result = await UserService.getAllUsers(page, limit, filters);

      return ResponseUtil.paginate(
        res,
        result.users,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update user
  updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { email, fullName, phone, avatar } = req.body;

      const user = await UserService.updateUser(id, {
        email,
        fullName,
        phone,
        avatar,
      });

      return ResponseUtil.success(res, user, MESSAGES.UPDATED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Email already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      if (error.message.includes("does not exist")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Delete user
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update user status
  updateUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await UserService.updateUserStatus(id, status);

      return ResponseUtil.success(res, user, "User status updated");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Invalid status")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update user role
  updateUserRole = async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await UserService.updateUserRole(id, role);

      return ResponseUtil.success(res, user, "User role updated");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("does not exist")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get users by role
  getUsersByRole = async (req, res) => {
    try {
      const { role } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await UserService.getUsersByRole(role, page, limit);

      return ResponseUtil.paginate(
        res,
        result.users,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Search users
  searchUsers = async (req, res) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!q) {
        return ResponseUtil.badRequest(res, "Search term is required");
      }

      // ✅ Thêm filters từ query params
      const filters = {};
      if (req.query.role) filters.role = req.query.role;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.provider) filters.provider = req.query.provider;

      const result = await UserService.searchUsers(q, page, limit, filters);

      return ResponseUtil.paginate(
        res,
        result.users,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // ✅ THÊM: Get statistics
  getUserStatistics = async (req, res) => {
    try {
      const stats = await UserService.getUserStatistics();
      return ResponseUtil.success(res, stats);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // ✅ THÊM: Elasticsearch health check
  checkElasticsearchHealth = async (req, res) => {
    try {
      const { getElasticsearch } = require("../config/elasticsearch.config");
      const client = getElasticsearch();

      const health = await client.cluster.health();
      const indexStats = await client.indices.stats({ index: "users" });

      const healthData = {
        cluster: {
          status: health.status,
          nodes: health.number_of_nodes,
          activeShards: health.active_shards,
        },
        index: {
          total: indexStats._all?.total?.docs?.count || 0,
          sizeInBytes: indexStats._all?.total?.store?.size_in_bytes || 0,
        },
        isHealthy: health.status === "green" || health.status === "yellow",
      };

      return ResponseUtil.success(res, healthData);
    } catch (error) {
      return ResponseUtil.error(res, {
        message: "Elasticsearch health check failed",
        error: error.message,
        isHealthy: false,
      });
    }
  };

  // ✅ THÊM: Reindex một user
  reindexUser = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await UserService.reindexUser(id);

      return ResponseUtil.success(res, user, "User reindexed successfully");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // ✅ THÊM: Reindex all users (admin only)
  reindexAllUsers = async (req, res) => {
    try {
      const result = await UserService.reindexAllUsers();
      return ResponseUtil.success(res, result);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };
}

module.exports = new UserController();
