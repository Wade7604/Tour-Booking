const PermissionModel = require("../models/permission.model");

const permissions = [
  // User permissions
  {
    name: "user:view",
    resource: "user",
    action: "view",
    description: "View users",
  },
  {
    name: "user:create",
    resource: "user",
    action: "create",
    description: "Create new users",
  },
  {
    name: "user:update",
    resource: "user",
    action: "update",
    description: "Update user information",
  },
  {
    name: "user:delete",
    resource: "user",
    action: "delete",
    description: "Delete users",
  },

  // Tour permissions
  {
    name: "tour:view",
    resource: "tour",
    action: "view",
    description: "View tours",
  },
  {
    name: "tour:create",
    resource: "tour",
    action: "create",
    description: "Create new tours",
  },
  {
    name: "tour:update",
    resource: "tour",
    action: "update",
    description: "Update tour information",
  },
  {
    name: "tour:delete",
    resource: "tour",
    action: "delete",
    description: "Delete tours",
  },

  // Destination permissions
  {
    name: "destination:view",
    resource: "destination",
    action: "view",
    description: "View destinations",
  },
  {
    name: "destination:create",
    resource: "destination",
    action: "create",
    description: "Create new destinations",
  },
  {
    name: "destination:update",
    resource: "destination",
    action: "update",
    description: "Update destination information",
  },
  {
    name: "destination:delete",
    resource: "destination",
    action: "delete",
    description: "Delete destinations",
  },

  // Booking permissions
  {
    name: "booking:view",
    resource: "booking",
    action: "view",
    description: "View all bookings",
  },
  {
    name: "booking:view-own",
    resource: "booking",
    action: "view-own",
    description: "View own bookings",
  },
  {
    name: "booking:create",
    resource: "booking",
    action: "create",
    description: "Create new bookings",
  },
  {
    name: "booking:update",
    resource: "booking",
    action: "update",
    description: "Update booking status",
  },
  {
    name: "booking:delete",
    resource: "booking",
    action: "delete",
    description: "Delete bookings",
  },

  // Role permissions
  {
    name: "role:view",
    resource: "role",
    action: "view",
    description: "View roles",
  },
  {
    name: "role:create",
    resource: "role",
    action: "create",
    description: "Create new roles",
  },
  {
    name: "role:update",
    resource: "role",
    action: "update",
    description: "Update roles",
  },
  {
    name: "role:delete",
    resource: "role",
    action: "delete",
    description: "Delete roles",
  },

  // Permission permissions
  {
    name: "permission:view",
    resource: "permission",
    action: "view",
    description: "View permissions",
  },
  {
    name: "permission:create",
    resource: "permission",
    action: "create",
    description: "Create new permissions",
  },
  {
    name: "permission:update",
    resource: "permission",
    action: "update",
    description: "Update permissions",
  },
  {
    name: "permission:delete",
    resource: "permission",
    action: "delete",
    description: "Delete permissions",
  },
];

const seedPermissions = async () => {
  try {
    console.log("🌱 Seeding permissions...");

    for (const permData of permissions) {
      const exists = await PermissionModel.nameExists(permData.name);

      if (!exists) {
        await PermissionModel.create(permData);
        console.log(`✅ Created permission: ${permData.name}`);
      } else {
        console.log(`⏭️  Permission already exists: ${permData.name}`);
      }
    }

    console.log("✅ Permissions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  }
};

module.exports = seedPermissions;
