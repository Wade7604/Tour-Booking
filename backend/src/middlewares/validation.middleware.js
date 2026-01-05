const { body, validationResult } = require("express-validator");
const ResponseUtil = require("../utils/response.util");

// Middleware để check validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return ResponseUtil.badRequest(res, "Validation failed", errorMessages);
  }
  next();
};

// Validation rules cho Google Sign-In
const googleSignInRules = [
  body("idToken")
    .notEmpty()
    .withMessage("ID Token is required")
    .isString()
    .withMessage("ID Token must be a string"),
];

// Validation rules cho Register với password mạnh hơn
const registerRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*?&#]/)
    .withMessage(
      "Password must contain at least one special character (@$!%*?&#)"
    ),
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .trim(),
  body("phone")
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage("Phone number must be valid Vietnamese format (10-11 digits)"),
];

// Validation rules cho Login
const loginRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validation rules cho update profile
const updateProfileRules = [
  body("fullName")
    .optional()
    .isString()
    .withMessage("Full name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .trim(),
  body("phone")
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage("Phone number must be valid Vietnamese format"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
];

// Validation rules cho change password
const changePasswordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[@$!%*?&#]/)
    .withMessage(
      "New password must contain at least one special character (@$!%*?&#)"
    )
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

// Validation rules cho reset password
const resetPasswordRules = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[@$!%*?&#]/)
    .withMessage(
      "New password must contain at least one special character (@$!%*?&#)"
    ),
];

module.exports = {
  validate,
  googleSignInRules,
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  resetPasswordRules,
};
