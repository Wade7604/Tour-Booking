// User roles
const ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
};

// User status
const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
};
const DESTINATION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

// Tour status
const TOUR_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DRAFT: "draft",
};

// Tour difficulty levels
const TOUR_DIFFICULTY = {
  EASY: "easy",
  MODERATE: "moderate",
  CHALLENGING: "challenging",
};

// Tour types
const TOUR_TYPE = {
  ADVENTURE: "adventure",
  CULTURAL: "cultural",
  BEACH: "beach",
  CITY: "city",
  NATURE: "nature",
  FOOD: "food",
  CRUISE: "cruise",
};

// Booking status
const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  REFUNDED: "refunded",
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

// Payment methods
const PAYMENT_METHOD = {
  BANK_TRANSFER: "bank_transfer",
  CREDIT_CARD: "credit_card",
  CASH: "cash",
  VNPAY: "vnpay",
  MOMO: "momo",
};

// Participant types
const PARTICIPANT_TYPE = {
  ADULT: "adult",
  CHILD: "child",
  INFANT: "infant",
};


// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Response messages
const MESSAGES = {
  SUCCESS: "Success",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  NOT_FOUND: "Not found",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  BAD_REQUEST: "Bad request",
  INTERNAL_ERROR: "Internal server error",

  // Auth messages
  LOGIN_SUCCESS: "Login successfully",
  REGISTER_SUCCESS: "Register successfully",
  LOGOUT_SUCCESS: "Logout successfully",
  EMAIL_EXIST: "Email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_INACTIVE: "Account is inactive",
  ACCOUNT_BANNED: "Account has been banned",
};

// Permissions
const PERMISSIONS = {
  // User permissions
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Tour permissions
  TOUR_VIEW: "tour:view",
  TOUR_CREATE: "tour:create",
  TOUR_UPDATE: "tour:update",
  TOUR_DELETE: "tour:delete",

  // Destination permissions
  DESTINATION_VIEW: "destination:view",
  DESTINATION_CREATE: "destination:create",
  DESTINATION_UPDATE: "destination:update",
  DESTINATION_DELETE: "destination:delete",

  // Booking permissions
  BOOKING_VIEW: "booking:view",
  BOOKING_VIEW_OWN: "booking:view-own",
  BOOKING_CREATE: "booking:create",
  BOOKING_UPDATE: "booking:update",
  BOOKING_DELETE: "booking:delete",

  // Role permissions
  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  // Permission permissions
  PERMISSION_VIEW: "permission:view",
  PERMISSION_CREATE: "permission:create",
  PERMISSION_UPDATE: "permission:update",
  PERMISSION_DELETE: "permission:delete",
};

module.exports = {
  ROLES,
  DESTINATION_STATUS,
  TOUR_STATUS,
  TOUR_DIFFICULTY,
  TOUR_TYPE,
  USER_STATUS,
  HTTP_STATUS,
  MESSAGES,
  PERMISSIONS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PARTICIPANT_TYPE,
};

