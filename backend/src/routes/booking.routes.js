const express = require("express");
const router = express.Router();
const BookingController = require("../controllers/booking.controller");
const { authenticateUser } = require("../middlewares/auth.middleware");
const { checkPermission } = require("../middlewares/permission.middleware");
const { PERMISSIONS } = require("../utils/constants");

// ===== USER ROUTES (Require booking:view-own or booking:create permission) =====

// Get user's own bookings
router.get(
  "/my-bookings",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.getMyBookings
);

// Get booking by booking code (own bookings)
router.get(
  "/code/:code",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.getBookingByCode
);

// Get booking by ID (own bookings)
router.get(
  "/:id",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.getBookingById
);

// Create new booking
router.post(
  "/",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_CREATE),
  BookingController.createBooking
);

// Update booking (own bookings)
router.put(
  "/:id",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.updateBooking
);

// Delete booking (own bookings, only pending)
router.delete(
  "/:id",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.deleteBooking
);

// Add payment to booking (own bookings)
router.post(
  "/:id/payment",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.addPayment
);

// Cancel booking (own bookings)
router.post(
  "/:id/cancel",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW_OWN),
  BookingController.cancelBooking
);

// ===== ADMIN ROUTES (Require booking:view or booking:update permission) =====

// Get all bookings (admin only)
router.get(
  "/admin/all",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW),
  BookingController.getAllBookings
);

// Get booking statistics (admin only)
router.get(
  "/admin/statistics",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW),
  BookingController.getBookingStatistics
);

// Get tour's bookings (admin only)
router.get(
  "/admin/tour/:tourId",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW),
  BookingController.getTourBookings
);

// Get booking by ID (admin - no ownership check)
router.get(
  "/admin/:id",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_VIEW),
  BookingController.getBookingByIdAdmin
);

// Update booking status (admin only)
router.patch(
  "/admin/:id/status",
  authenticateUser,
  checkPermission(PERMISSIONS.BOOKING_UPDATE),
  BookingController.updateBookingStatus
);

module.exports = router;

