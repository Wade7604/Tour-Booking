const BookingModel = require("../models/booking.model");
const TourService = require("../services/tour.service");
const UserModel = require("../models/user.model");
const EmailService = require("./email.service");
const {
  MESSAGES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require("../utils/constants");

class BookingService {
  // Create new booking
  async createBooking(bookingData, userId) {
    try {
      // Validate tour exists
      const tour = await TourService.getTourById(bookingData.tourId);

      // Validate user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Validate selected date
      if (!bookingData.selectedDate || !bookingData.selectedDate.startDate) {
        throw new Error("Selected date is required");
      }

      // Check if selected date is available and get current slots
      const dateAvailable = tour.availableDates?.find(
        (date) => date.startDate === bookingData.selectedDate.startDate
      );

      if (!dateAvailable) {
        throw new Error("Selected date is not available for this tour");
      }

      const requestedSlots = bookingData.totalParticipants || 
        (bookingData.numberOfAdults || 0) + 
        (bookingData.numberOfChildren || 0) + 
        (bookingData.numberOfInfants || 0);

      const availableSlots = await TourService.getAvailableSlots(
        tour.id, 
        dateAvailable.startDate, 
        dateAvailable.endDate
      );

      if (requestedSlots > availableSlots) {
        throw new Error(
          `Not enough slots available. Only ${availableSlots} slots remaining`
        );
      }

      // Validate participant counts
      if (requestedSlots < tour.minGroupSize) {
        throw new Error(
          `Minimum group size is ${tour.minGroupSize} participants`
        );
      }

      if (requestedSlots > tour.maxGroupSize) {
        throw new Error(
          `Maximum group size is ${tour.maxGroupSize} participants`
        );
      }

      // Set pricing from tour if not provided
      if (!bookingData.pricing) {
        bookingData.pricing = {
          adultPrice: tour.price.adult || 0,
          childPrice: tour.price.child || 0,
          infantPrice: tour.price.infant || 0,
        };
      }

      // Set userId
      bookingData.userId = userId;

      // Calculate deposit (40% of total)
      const subtotal =
        (bookingData.numberOfAdults || 0) * (bookingData.pricing.adultPrice || 0) +
        (bookingData.numberOfChildren || 0) * (bookingData.pricing.childPrice || 0) +
        (bookingData.numberOfInfants || 0) * (bookingData.pricing.infantPrice || 0);

      const total = subtotal - (bookingData.pricing?.discount || 0) + (bookingData.pricing?.tax || 0);
      
      if (!bookingData.payment) {
        bookingData.payment = {};
      }
      
      bookingData.payment.depositRequired = Math.round(total * 0.4);

      // Create booking
      const booking = await BookingModel.create(bookingData);

      // Update tour's booked slots via TourService
      await TourService.incrementBookedSlots(
        tour.id,
        dateAvailable.startDate,
        dateAvailable.endDate,
        requestedSlots
      );

      // Send booking confirmation email
      try {
        await EmailService.sendBookingConfirmation(booking, tour);
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError);
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  // Get booking by ID (with ownership check)
  async getBookingById(bookingId, userId = null) {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check ownership if userId provided
      if (userId && booking.userId !== userId) {
        throw new Error(MESSAGES.FORBIDDEN);
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  // Get booking by ID without ownership check (for admin)
  async getBookingByIdAdmin(bookingId) {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  // Get booking by booking code
  async getBookingByCode(bookingCode, userId = null) {
    try {
      const booking = await BookingModel.findByBookingCode(bookingCode);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check ownership if userId provided
      if (userId && booking.userId !== userId) {
        throw new Error(MESSAGES.FORBIDDEN);
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  // Get all bookings (for admin - no filtering)
  async getAllBookings(options = {}) {
    try {
      return await BookingModel.findAll(options);
    } catch (error) {
      throw error;
    }
  }

  // Get user's own bookings
  async getUserBookings(userId, options = {}) {
    try {
      options.userId = userId;
      return await BookingModel.findAll(options);
    } catch (error) {
      throw error;
    }
  }

  // Get tour's bookings
  async getTourBookings(tourId, options = {}) {
    try {
      options.tourId = tourId;
      return await BookingModel.findAll(options);
    } catch (error) {
      throw error;
    }
  }

  // Update booking (with ownership check)
  async updateBooking(bookingId, updateData, userId) {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check ownership
      if (booking.userId !== userId) {
        throw new Error(MESSAGES.FORBIDDEN);
      }

      // Prevent updating certain fields
      delete updateData.id;
      delete updateData.bookingCode;
      delete updateData.userId;
      delete updateData.tourId;
      delete updateData.createdAt;
      delete updateData.createdBy;
      delete updateData.status; // Users can't update status directly

      updateData.updatedBy = userId;

      const updatedBooking = await BookingModel.update(bookingId, updateData);
      return updatedBooking;
    } catch (error) {
      throw error;
    }
  }

  // Delete booking (with ownership check)
  async deleteBooking(bookingId, userId) {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check ownership
      if (booking.userId !== userId) {
        throw new Error(MESSAGES.FORBIDDEN);
      }

      // Only allow deletion if booking is pending
      if (booking.status !== BOOKING_STATUS.PENDING) {
        throw new Error(
          "Only pending bookings can be deleted. Please cancel confirmed bookings instead."
        );
      }

      await BookingModel.delete(bookingId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Update booking status (admin only - no ownership check)
  async updateBookingStatus(bookingId, status, userId, note = "") {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Validate status
      if (!Object.values(BOOKING_STATUS).includes(status)) {
        throw new Error("Invalid booking status");
      }

      // Business logic for status transitions
      if (status === BOOKING_STATUS.CONFIRMED) {
        // Check if deposit is paid
        if (!booking.payment.depositPaid) {
          throw new Error("Cannot confirm booking without deposit payment");
        }
      }

      if (status === BOOKING_STATUS.COMPLETED) {
        // Check if fully paid
        if (booking.payment.remainingAmount > 0) {
          throw new Error("Cannot complete booking with outstanding payment");
        }

        // Check if tour date has passed
        const tourDate = new Date(booking.selectedDate.startDate);
        const now = new Date();
        if (tourDate > now) {
          throw new Error("Cannot complete booking before tour date");
        }
      }

      const updatedBooking = await BookingModel.updateStatus(
        bookingId,
        status,
        userId,
        note
      );

      return updatedBooking;
    } catch (error) {
      throw error;
    }
  }

  // Add payment (with ownership check)
  async addPayment(bookingId, paymentData, userId) {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check ownership
      if (booking.userId !== userId) {
        throw new Error(MESSAGES.FORBIDDEN);
      }

      return this._processPayment(booking, paymentData, userId);
    } catch (error) {
      throw error;
    }
  }

  // Add payment (admin - no ownership check)
  async addPaymentAdmin(bookingId, paymentData, userId) {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      return this._processPayment(booking, paymentData, userId);
    } catch (error) {
      throw error;
    }
  }

  // Helper to process payment logic
  async _processPayment(booking, paymentData, userId)  {
      // Validate payment amount
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Check if payment exceeds remaining amount
      if (paymentData.amount > booking.payment.remainingAmount) {
        throw new Error(
          `Payment amount exceeds remaining amount of ${booking.payment.remainingAmount}`
        );
      }

      // Validate payment method
      if (
        paymentData.method &&
        !Object.values(PAYMENT_METHOD).includes(paymentData.method)
      ) {
        throw new Error("Invalid payment method");
      }

      const updatedBooking = await BookingModel.addPaymentTransaction(
        booking.id,
        paymentData
      );

      // Send payment confirmation email
      try {
        const tour = await TourService.getTourById(booking.tourId);
        const lastTransaction =
          updatedBooking.payment.transactions[
            updatedBooking.payment.transactions.length - 1
          ];
        await EmailService.sendPaymentConfirmation(
          updatedBooking,
          tour,
          lastTransaction
        );
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
      }

      // Auto-confirm booking if deposit is paid and status is pending
      if (
        updatedBooking.payment.depositPaid &&
        updatedBooking.status === BOOKING_STATUS.PENDING
      ) {
        await this.updateBookingStatus(
          booking.id,
          BOOKING_STATUS.CONFIRMED,
          userId,
          "Auto-confirmed after deposit payment"
        );
      }

      return updatedBooking;
  }

  // Cancel booking (with ownership check)
  async cancelBooking(bookingId, userId, reason = "") {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        throw new Error(MESSAGES.NOT_FOUND);
      }

      // Check ownership
      if (booking.userId !== userId) {
        throw new Error(MESSAGES.FORBIDDEN);
      }

      // Check if already cancelled
      if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new Error("Booking is already cancelled");
      }

      // Check if already completed
      if (booking.status === BOOKING_STATUS.COMPLETED) {
        throw new Error("Cannot cancel completed booking");
      }

      // Calculate refund amount based on cancellation policy
      let refundAmount = 0;
      const tourDate = new Date(booking.selectedDate.startDate);
      const now = new Date();
      const daysUntilTour = Math.ceil((tourDate - now) / (1000 * 60 * 60 * 24));

      // Cancellation policy
      if (daysUntilTour > 30) {
        refundAmount = booking.payment.paidAmount * 0.9;
      } else if (daysUntilTour >= 15) {
        refundAmount = booking.payment.paidAmount * 0.5;
      } else if (daysUntilTour >= 7) {
        refundAmount = booking.payment.paidAmount * 0.25;
      }

      const cancelledBooking = await BookingModel.cancelBooking(
        bookingId,
        userId,
        reason
      );

      // Update refund information
      if (refundAmount > 0) {
        await BookingModel.update(bookingId, {
          "cancellation.refundAmount": Math.round(refundAmount),
          "cancellation.refundStatus": PAYMENT_STATUS.PENDING,
        });
      }

      // Return slots to tour via TourService
      try {
        await TourService.decrementBookedSlots(
          booking.tourId,
          booking.selectedDate.startDate,
          booking.selectedDate.endDate,
          booking.totalParticipants
        );
      } catch (slotError) {
        console.error("Failed to update tour slots during cancellation:", slotError);
      }

      const result = {
        ...cancelledBooking,
        refundAmount: Math.round(refundAmount),
        refundPolicy: `${daysUntilTour} days until tour`,
      };

      // Send cancellation email
      try {
        const tour = await TourService.getTourById(booking.tourId);
        await EmailService.sendBookingCancellation(booking, tour, result);
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get booking statistics (admin only - no checks needed)
  async getBookingStatistics() {
    try {
      return await BookingModel.getStatistics();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BookingService();

