const UserService = require("../services/user.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class UserController {
  // ===== OWN PROFILE METHODS =====

  /**
   * Get own profile
   * @route GET /api/users/me
   * @access Private (Any authenticated user)
   */
  getOwnProfile = async (req, res) => {
    try {
      const userId = req.user.uid;
      const user = await UserService.getUserById(userId);

      return ResponseUtil.success(res, user);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  /**
   * Update own profile
   * @route PUT /api/users/me
   * @access Private (Requires user:update-own permission)
   */
  updateOwnProfile = async (req, res) => {
    try {
      const userId = req.user.uid;
      const { email, fullName, phone, avatar } = req.body;

      // Only allow updating specific fields
      const allowedUpdates = {
        email,
        fullName,
        phone,
        avatar,
      };

      // Remove undefined fields
      Object.keys(allowedUpdates).forEach(
        (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      if (Object.keys(allowedUpdates).length === 0) {
        return ResponseUtil.badRequest(
          res,
          "At least one field is required to update"
        );
      }

      const user = await UserService.updateUser(userId, allowedUpdates);

      return ResponseUtil.success(res, user, "Profile updated successfully");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Email already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // ===== ADMIN METHODS =====

  /**
   * Create user
   * @route POST /api/users
   * @access Private (Requires user:create permission)
   */
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

  /**
   * Get user by ID
   * @route GET /api/users/:id
   * @access Private (Requires user:view permission)
   */
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

  /**
   * Get all users
   * @route GET /api/users
   * @access Private (Requires user:view permission)
   */
  getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Validate pagination
      if (page < 1 || limit < 1 || limit > 100) {
        return ResponseUtil.badRequest(
          res,
          "Invalid pagination. Page must be >= 1, limit between 1-100"
        );
      }

      // Optional filters
      const filters = {};
      if (req.query.role) filters.role = req.query.role;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.provider) filters.provider = req.query.provider;

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

  /**
   * Update user (Admin)
   * @route PUT /api/users/:id
   * @access Private (Requires user:update permission)
   */
  updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { email, fullName, phone, avatar, role, status } = req.body;

      // Admin can update all fields
      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        return ResponseUtil.badRequest(
          res,
          "At least one field is required to update"
        );
      }

      const user = await UserService.updateUser(id, updateData);

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

  /**
   * Delete user
   * @route DELETE /api/users/:id
   * @access Private (Requires user:delete permission)
   */
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent user from deleting themselves
      if (id === req.user.uid) {
        return ResponseUtil.badRequest(
          res,
          "You cannot delete your own account"
        );
      }

      await UserService.deleteUser(id);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  /**
   * Update user status
   * @route PATCH /api/users/:id/status
   * @access Private (Requires user:update permission)
   */
  updateUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return ResponseUtil.badRequest(res, "Status is required");
      }

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

  /**
   * Update user role
   * @route PATCH /api/users/:id/role
   * @access Private (Admin only)
   */
  updateUserRole = async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return ResponseUtil.badRequest(res, "Role is required");
      }

      // Prevent changing own role
      if (id === req.user.uid) {
        return ResponseUtil.badRequest(res, "You cannot change your own role");
      }

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

  /**
   * Get users by role
   * @route GET /api/users/role/:role
   * @access Private (Requires user:view permission)
   */
  getUsersByRole = async (req, res) => {
    try {
      const { role } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (page < 1 || limit < 1 || limit > 100) {
        return ResponseUtil.badRequest(
          res,
          "Invalid pagination. Page must be >= 1, limit between 1-100"
        );
      }

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

  /**
   * Search users
   * @route GET /api/users/search
   * @access Private (Requires user:view permission)
   */
  searchUsers = async (req, res) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!q) {
        return ResponseUtil.badRequest(res, "Search term is required");
      }

      if (page < 1 || limit < 1 || limit > 100) {
        return ResponseUtil.badRequest(
          res,
          "Invalid pagination. Page must be >= 1, limit between 1-100"
        );
      }

      // Filters
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

  /**
   * Get user statistics
   * @route GET /api/users/statistics
   * @access Private (Requires user:view permission)
   */
  getUserStatistics = async (req, res) => {
    try {
      const stats = await UserService.getUserStatistics();
      return ResponseUtil.success(res, stats);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  /**
   * Elasticsearch health check
   * @route GET /api/users/elasticsearch/health
   * @access Private (Requires user:view permission)
   */
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

  /**
   * Reindex a user
   * @route POST /api/users/:id/reindex
   * @access Private (Requires user:update permission)
   */
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

  /**
   * Reindex all users
   * @route POST /api/users/elasticsearch/reindex
   * @access Private (Admin only)
   */
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
