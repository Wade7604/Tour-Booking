require("dotenv").config();
const { initializeFirebase } = require("../config/firebase.config");

const runSeeds = async () => {
  try {
    console.log("🚀 Starting database seeding...\n");

    // Initialize Firebase FIRST
    initializeFirebase();

    // Import seeders AFTER Firebase is initialized
    const seedPermissions = require("./permission.seed");
    const seedRoles = require("./role.seed");

    // Seed permissions first
    await seedPermissions();
    console.log("");

    // Then seed roles (roles depend on permissions)
    await seedRoles();
    console.log("");

    console.log("✅ All seeds completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeeds();
