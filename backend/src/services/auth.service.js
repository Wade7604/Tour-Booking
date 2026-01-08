const { getAuth } = require("../config/firebase.config");
const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");
const PermissionModel = require("../models/permission.model");
const { MESSAGES, USER_STATUS } = require("../utils/constants");

class AuthService {
  // Verify Firebase ID Token (Google Sign-In) và tạo/update user
  async verifyAndCreateUser(idToken) {
    try {
      const auth = getAuth();

      // Verify Firebase ID Token
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get user info from Firebase Auth
      const userRecord = await auth.getUser(uid);

      // Create or update user in Firestore
      const user = await UserModel.createOrUpdate(uid, {
        email: userRecord.email,
        fullName: userRecord.displayName || userRecord.email.split("@")[0],
        avatar: userRecord.photoURL || null,
        phone: userRecord.phoneNumber || null,
        provider: "google",
      });

      // Check if account is active
      if (user.status === USER_STATUS.INACTIVE) {
        throw new Error(MESSAGES.ACCOUNT_INACTIVE);
      }

      if (user.status === USER_STATUS.BANNED) {
        throw new Error(MESSAGES.ACCOUNT_BANNED);
      }

      return user;
    } catch (error) {
      if (error.code === "auth/id-token-expired") {
        throw new Error("Token expired");
      }
      if (error.code === "auth/invalid-id-token") {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }

  // Register with Email & Password
  async registerWithEmail(userData) {
    try {
      const auth = getAuth();

      // Check if email exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new Error(MESSAGES.EMAIL_EXIST);
      }

      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.fullName,
      });

      // Create user in Firestore
      const user = await UserModel.createOrUpdate(userRecord.uid, {
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone || null,
        provider: "email",
      });

      return user;
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        throw new Error(MESSAGES.EMAIL_EXIST);
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email format");
      }
      if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak (minimum 6 characters)");
      }
      throw error;
    }
  }

  // Login with Email & Password - FIX ĐỂ VERIFY PASSWORD
  async loginWithEmail(email, password) {
    try {
      const auth = getAuth();

      // Check Firebase Web API Key
      const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY;
      if (!firebaseApiKey) {
        throw new Error(
          "FIREBASE_WEB_API_KEY not configured. Please add it to .env file"
        );
      }

      // Call Firebase Auth REST API để verify password
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
            returnSecureToken: true,
          }),
        }
      );

      const data = await response.json();

      // Check if login failed
      if (!response.ok) {
        console.error("Firebase Auth Error:", data.error);
        throw new Error(MESSAGES.INVALID_CREDENTIALS);
      }

      // Get user from Firestore
      const user = await UserModel.findById(data.localId);

      if (!user) {
        throw new Error(MESSAGES.INVALID_CREDENTIALS);
      }

      // Check if account is active
      if (user.status === USER_STATUS.INACTIVE) {
        throw new Error(MESSAGES.ACCOUNT_INACTIVE);
      }

      if (user.status === USER_STATUS.BANNED) {
        throw new Error(MESSAGES.ACCOUNT_BANNED);
      }

      return {
        user,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      if (error.message.includes("INVALID_PASSWORD")) {
        throw new Error(MESSAGES.INVALID_CREDENTIALS);
      }
      if (error.message.includes("EMAIL_NOT_FOUND")) {
        throw new Error(MESSAGES.INVALID_CREDENTIALS);
      }
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      const userRole = await RoleModel.findByName(user.role);

      if (!userRole) {
        return {
          ...user,
          roleDetails: null,
          permissions: [],
        };
      }

      const permissionNames = userRole.permissions || [];

      const permissionDetails = await PermissionModel.findByNames(
        permissionNames
      );

      return {
        ...user,
        roleDetails: userRole,
        permissions: permissionDetails,
      };
    } catch (error) {
      throw error;
    }
  }
  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      const user = await UserModel.update(userId, updateData);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
