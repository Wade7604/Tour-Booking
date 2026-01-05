const { HTTP_STATUS } = require("./constants");

class ResponseUtil {
  static success(
    res,
    data = null,
    message = "Success",
    statusCode = HTTP_STATUS.OK
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res,
    message = "Error",
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static created(res, data = null, message = "Created successfully") {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static badRequest(res, message = "Bad request", errors = null) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(res, message = "Unauthorized") {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res, message = "Forbidden") {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res, message = "Not found") {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res, message = "Conflict") {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  static paginate(res, data, page, limit, total, message = "Success") {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}

module.exports = ResponseUtil;
