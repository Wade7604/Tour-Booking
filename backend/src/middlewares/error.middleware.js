const ResponseUtil = require("../utils/response.util");

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return ResponseUtil.badRequest(res, err.message);
  }

  // Firebase errors
  if (err.code && err.code.startsWith("auth/")) {
    return ResponseUtil.unauthorized(res, err.message);
  }

  // Default error
  return ResponseUtil.error(res, err.message || "Internal server error");
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  return ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
