const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const { authenticateUser } = require("../middlewares/auth.middleware");
const {
  validate,
  googleSignInRules,
  registerRules,
  loginRules,
  updateProfileRules,
} = require("../middlewares/validation.middleware");

// POST /api/auth/google - Sign in with Google
router.post(
  "/google",
  googleSignInRules,
  validate,
  AuthController.signInWithGoogle
);

// POST /api/auth/register - Register with Email & Password
router.post("/register", registerRules, validate, AuthController.register);

// POST /api/auth/login - Login with Email & Password
router.post("/login", loginRules, validate, AuthController.login);

// POST /api/auth/sign-out - Sign out
router.post("/sign-out", authenticateUser, AuthController.signOut);

// GET /api/auth/me - Get current user info
router.get("/me", authenticateUser, AuthController.getCurrentUser);

// PUT /api/auth/profile - Update user profile
router.put(
  "/profile",
  authenticateUser,
  updateProfileRules,
  validate,
  AuthController.updateProfile
);

module.exports = router;
