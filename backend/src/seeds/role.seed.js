const RoleModel = require("../models/role.model");

const roles = [
  {
    name: "admin",
    displayName: "Administrator",
    description: "Full system access",
    isSystem: true,
    permissions: [
      // All permissions
      "user:view",
      "user:create",
      "user:update",
      "user:delete",
      "tour:view",
      "tour:create",
      "tour:update",
      "tour:delete",
      "destination:view",
      "destination:create",
      "destination:update",
      "destination:delete",
      "booking:view",
      "booking:view-own",
      "booking:create",
      "booking:update",
      "booking:delete",
      "role:view",
      "role:create",
      "role:update",
      "role:delete",
      "permission:view",
      "permission:create",
      "permission:update",
      "permission:delete",
    ],
  },
  {
    name: "manager",
    displayName: "Manager",
    description: "Manage tours, destinations and bookings",
    isSystem: true,
    permissions: [
      "user:view",
      "tour:view",
      "tour:create",
      "tour:update",
      "tour:delete",
      "destination:view",
      "destination:create",
      "destination:update",
      "destination:delete",
      "booking:view",
      "booking:update",
      "role:view",
      "permission:view",
    ],
  },
  {
    name: "user",
    displayName: "User",
    description: "Regular user - can book tours",
    isSystem: true,
    permissions: [
      "tour:view",
      "destination:view",
      "booking:view-own",
      "booking:create",
    ],
  },
  {
    name: "guest",
    displayName: "Guest",
    description: "Guest user - view only",
    isSystem: true,
    permissions: ["tour:view", "destination:view"],
  },
];

const seedRoles = async () => {
  try {
    console.log("🌱 Seeding roles...");

    for (const roleData of roles) {
      const exists = await RoleModel.nameExists(roleData.name);

      if (!exists) {
        await RoleModel.create(roleData);
        console.log(
          `✅ Created role: ${roleData.name} (${roleData.permissions.length} permissions)`
        );
      } else {
        console.log(`⏭️  Role already exists: ${roleData.name}`);
      }
    }

    console.log("✅ Roles seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    throw error;
  }
};

module.exports = seedRoles;
