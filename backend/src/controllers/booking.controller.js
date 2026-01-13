const BookingService = require("../services/booking.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class BookingController {
  // Create new booking
  createBooking = async (req, res) => {
    try {
      const userId = req.user.uid; // From auth middleware

      const bookingData = {
        tourId: req.body.tourId,
        selectedDate: req.body.selectedDate,
        customerInfo: req.body.customerInfo,
        participants: req.body.participants,
        numberOfAdults: req.body.numberOfAdults,
        numberOfChildren: req.body.numberOfChildren,
        numberOfInfants: req.body.numberOfInfants,
        specialRequests: req.body.specialRequests,
        emergencyContact: req.body.emergencyContact,
        addOns: req.body.addOns,
      };

      const booking = await BookingService.createBooking(bookingData, userId);

      return ResponseUtil.created(res, booking, "Booking created successfully");
    } catch (error) {
      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("required")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("not available") || error.message.includes("slots")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get booking by ID (user - with ownership check)
  getBookingById = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const booking = await BookingService.getBookingById(id, userId);

      return ResponseUtil.success(res, booking);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === MESSAGES.FORBIDDEN) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get booking by ID (admin - no ownership check)
  getBookingByIdAdmin = async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await BookingService.getBookingByIdAdmin(id);

      return ResponseUtil.success(res, booking);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get booking by booking code
  getBookingByCode = async (req, res) => {
    try {
      const { code } = req.params;
      const userId = req.user.uid;

      const booking = await BookingService.getBookingByCode(code, userId);

      return ResponseUtil.success(res, booking);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === MESSAGES.FORBIDDEN) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get all bookings (admin only)
  getAllBookings = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const options = {
        page,
        limit,
        status: req.query.status,
        tourId: req.query.tourId,
        userId: req.query.userId, // Admin can filter by userId
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await BookingService.getAllBookings(options);

      return ResponseUtil.paginate(
        res,
        result.bookings,
        page,
        limit,
        result.pagination.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get user's own bookings
  getMyBookings = async (req, res) => {
    try {
      const userId = req.user.uid;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const options = {
        page,
        limit,
        status: req.query.status,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await BookingService.getUserBookings(userId, options);

      return ResponseUtil.paginate(
        res,
        result.bookings,
        page,
        limit,
        result.pagination.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get tour's bookings (admin only)
  getTourBookings = async (req, res) => {
    try {
      const { tourId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const options = {
        page,
        limit,
        status: req.query.status,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await BookingService.getTourBookings(tourId, options);

      return ResponseUtil.paginate(
        res,
        result.bookings,
        page,
        limit,
        result.pagination.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update booking
  updateBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const updateData = {
        customerInfo: req.body.customerInfo,
        participants: req.body.participants,
        specialRequests: req.body.specialRequests,
        emergencyContact: req.body.emergencyContact,
        internalNotes: req.body.internalNotes,
      };

      const booking = await BookingService.updateBooking(id, updateData, userId);

      return ResponseUtil.success(res, booking, MESSAGES.UPDATED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === MESSAGES.FORBIDDEN) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Delete booking
  deleteBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      await BookingService.deleteBooking(id, userId);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === MESSAGES.FORBIDDEN) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes("Only pending bookings")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update booking status (admin only)
  updateBookingStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const userId = req.user.uid;

      if (!status) {
        return ResponseUtil.badRequest(res, "Status is required");
      }

      const booking = await BookingService.updateBookingStatus(
        id,
        status,
        userId,
        note
      );

      return ResponseUtil.success(res, booking, "Booking status updated");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Invalid")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("Cannot")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Add payment
  addPayment = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const paymentData = {
        amount: req.body.amount,
        method: req.body.method,
        transactionId: req.body.transactionId,
        note: req.body.note,
      };

      if (!paymentData.amount) {
        return ResponseUtil.badRequest(res, "Payment amount is required");
      }

      const booking = await BookingService.addPayment(id, paymentData, userId);

      return ResponseUtil.success(res, booking, "Payment added successfully");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === MESSAGES.FORBIDDEN) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes("Invalid") || error.message.includes("exceeds")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Add payment (Admin)
  addPaymentAdmin = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const paymentData = {
        amount: req.body.amount,
        method: req.body.method,
        transactionId: req.body.transactionId,
        note: req.body.note,
      };

      if (!paymentData.amount) {
        return ResponseUtil.badRequest(res, "Payment amount is required");
      }

      const booking = await BookingService.addPaymentAdmin(id, paymentData, userId);

      return ResponseUtil.success(res, booking, "Payment added successfully");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Invalid") || error.message.includes("exceeds")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Cancel booking
  cancelBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.uid;

      const result = await BookingService.cancelBooking(id, userId, reason);

      return ResponseUtil.success(res, result, "Booking cancelled successfully");
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === MESSAGES.FORBIDDEN) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes("already") || error.message.includes("Cannot")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get booking statistics (admin only)
  getBookingStatistics = async (req, res) => {
    try {
      const stats = await BookingService.getBookingStatistics();
      return ResponseUtil.success(res, stats);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };
}

module.exports = new BookingController();

