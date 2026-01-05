const { getAuth } = require("../config/firebase.config");
const ResponseUtil = require("../utils/response.util");

// Middleware xác thực Firebase token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ResponseUtil.unauthorized(res, "No token provided");
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify Firebase ID Token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Attach user info to request
    req.user = decodedToken;

    next();
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return ResponseUtil.unauthorized(res, "Token expired");
    }
    if (error.code === "auth/argument-error") {
      return ResponseUtil.unauthorized(res, "Invalid token");
    }
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }
};

// Middleware optional auth (không bắt buộc đăng nhập)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      req.user = decodedToken;
    }

    next();
  } catch (error) {
    // Nếu có lỗi thì bỏ qua, vẫn cho request đi tiếp
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
};
