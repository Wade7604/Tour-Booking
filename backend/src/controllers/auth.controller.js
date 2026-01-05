const AuthService = require("../services/auth.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class AuthController {
  // Sign In with Google (Firebase Authentication)
  async signInWithGoogle(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return ResponseUtil.badRequest(res, "ID Token is required");
      }

      const user = await AuthService.verifyAndCreateUser(idToken);

      return ResponseUtil.success(res, user, MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      if (
        error.message === "Token expired" ||
        error.message === "Invalid token"
      ) {
        return ResponseUtil.unauthorized(res, error.message);
      }
      if (
        error.message === MESSAGES.ACCOUNT_INACTIVE ||
        error.message === MESSAGES.ACCOUNT_BANNED
      ) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Register with Email & Password
  async register(req, res) {
    try {
      const { email, password, fullName, phone } = req.body;

      const result = await AuthService.registerWithEmail({
        email,
        password,
        fullName,
        phone,
      });

      return ResponseUtil.created(res, result, MESSAGES.REGISTER_SUCCESS);
    } catch (error) {
      if (error.message === MESSAGES.EMAIL_EXIST) {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Login with Email & Password
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.loginWithEmail(email, password);

      return ResponseUtil.success(res, result, MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      if (error.message === MESSAGES.INVALID_CREDENTIALS) {
        return ResponseUtil.unauthorized(res, error.message);
      }
      if (
        error.message === MESSAGES.ACCOUNT_INACTIVE ||
        error.message === MESSAGES.ACCOUNT_BANNED
      ) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.uid;
      const user = await AuthService.getCurrentUser(userId);

      return ResponseUtil.success(res, user);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  }

  // Update profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.uid;
      const { fullName, phone, avatar } = req.body;

      const user = await AuthService.updateProfile(userId, {
        fullName,
        phone,
        avatar,
      });

      return ResponseUtil.success(res, user, MESSAGES.UPDATED);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }

  // Sign Out
  async signOut(req, res) {
    try {
      return ResponseUtil.success(res, null, MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  }
}

module.exports = new AuthController();
