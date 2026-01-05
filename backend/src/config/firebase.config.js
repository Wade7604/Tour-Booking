const admin = require("firebase-admin");

let isInitialized = false;

// Khởi tạo Firebase Admin SDK
const initializeFirebase = () => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log("⚠️ Firebase already initialized");
    return;
  }

  try {
    // Validate required environment variables
    const requiredEnvVars = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_CLIENT_EMAIL",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    isInitialized = true;
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error.message);
    throw error; // Let the caller decide how to handle this
  }
};

// Lấy Firestore instance
const getFirestore = () => {
  if (!isInitialized) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first."
    );
  }
  return admin.firestore();
};

// Lấy Auth instance
const getAuth = () => {
  if (!isInitialized) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first."
    );
  }
  return admin.auth();
};

// Check initialization status
const isFirebaseInitialized = () => {
  return isInitialized;
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  isFirebaseInitialized,
  admin,
};
