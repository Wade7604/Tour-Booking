const { getFirestore } = require("../config/firebase.config");
const { COLLECTIONS } = require("../config/database.config");
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PARTICIPANT_TYPE,
} = require("../utils/constants");

class BookingModel {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTIONS.BOOKINGS);
  }

  // Generate unique booking code
  generateBookingCode() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `BK${year}${month}${day}${random}`;
  }

  // Create new booking
  async create(bookingData) {
    try {
      const bookingRef = this.collection.doc();
      const bookingId = bookingRef.id;
      const bookingCode = this.generateBookingCode();

      const newBooking = {
        id: bookingId,
        bookingCode,

        // Liên kết
        tourId: bookingData.tourId,
        userId: bookingData.userId,

        // Ngày khởi hành đã chọn
        selectedDate: {
          startDate: bookingData.selectedDate.startDate,
          endDate: bookingData.selectedDate.endDate,
          availableSlots: bookingData.selectedDate.availableSlots || 0,
          bookedSlots: bookingData.selectedDate.bookedSlots || 0,
        },

        // Thông tin người đặt
        customerInfo: {
          fullName: bookingData.customerInfo.fullName,
          email: bookingData.customerInfo.email,
          phone: bookingData.customerInfo.phone,
          address: bookingData.customerInfo.address || "",
          nationality: bookingData.customerInfo.nationality || "Vietnam",
          passportNumber: bookingData.customerInfo.passportNumber || "",
        },

        // Danh sách khách tham gia
        participants: bookingData.participants || [],

        // Số lượng
        numberOfAdults: bookingData.numberOfAdults || 0,
        numberOfChildren: bookingData.numberOfChildren || 0,
        numberOfInfants: bookingData.numberOfInfants || 0,
        totalParticipants:
          (bookingData.numberOfAdults || 0) +
          (bookingData.numberOfChildren || 0) +
          (bookingData.numberOfInfants || 0),

        // Thông tin giá và thanh toán
        pricing: {
          adultPrice: bookingData.pricing.adultPrice || 0,
          childPrice: bookingData.pricing.childPrice || 0,
          infantPrice: bookingData.pricing.infantPrice || 0,

          breakdown: {
            adults: {
              quantity: bookingData.numberOfAdults || 0,
              unitPrice: bookingData.pricing.adultPrice || 0,
              total:
                (bookingData.numberOfAdults || 0) *
                (bookingData.pricing.adultPrice || 0),
            },
            children: {
              quantity: bookingData.numberOfChildren || 0,
              unitPrice: bookingData.pricing.childPrice || 0,
              total:
                (bookingData.numberOfChildren || 0) *
                (bookingData.pricing.childPrice || 0),
            },
            infants: {
              quantity: bookingData.numberOfInfants || 0,
              unitPrice: bookingData.pricing.infantPrice || 0,
              total:
                (bookingData.numberOfInfants || 0) *
                (bookingData.pricing.infantPrice || 0),
            },
          },

          subtotal: 0, // Will be calculated
          discount: bookingData.pricing.discount || 0,
          tax: bookingData.pricing.tax || 0,
          total: 0, // Will be calculated
        },

        // Thanh toán
        payment: {
          method: bookingData.payment?.method || PAYMENT_METHOD.BANK_TRANSFER,
          status: PAYMENT_STATUS.PENDING,
          paidAmount: 0,
          remainingAmount: 0, // Will be calculated

          transactions: [],

          depositRequired: bookingData.payment?.depositRequired || 0,
          depositPaid: false,
          depositPaidAt: null,
        },

        // Trạng thái booking
        status: BOOKING_STATUS.PENDING,
        statusHistory: [
          {
            status: BOOKING_STATUS.PENDING,
            changedAt: new Date().toISOString(),
            changedBy: bookingData.userId,
            note: "Booking created",
          },
        ],

        // Yêu cầu đặc biệt
        specialRequests: bookingData.specialRequests || "",

        // Dịch vụ thêm
        addOns: bookingData.addOns || [],

        // Ghi chú nội bộ
        internalNotes: bookingData.internalNotes || "",

        // Thông tin liên hệ khẩn cấp
        emergencyContact: bookingData.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
        },

        // Hủy và hoàn tiền
        cancellation: {
          isCancelled: false,
          cancelledAt: null,
          cancelledBy: null,
          reason: null,
          refundAmount: 0,
          refundStatus: null,
          refundedAt: null,
        },

        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmedAt: null,
        cancelledAt: null,
        createdBy: bookingData.userId,
        updatedBy: bookingData.userId,
      };

      // Calculate pricing
      newBooking.pricing.subtotal =
        newBooking.pricing.breakdown.adults.total +
        newBooking.pricing.breakdown.children.total +
        newBooking.pricing.breakdown.infants.total;

      newBooking.pricing.total =
        newBooking.pricing.subtotal -
        newBooking.pricing.discount +
        newBooking.pricing.tax;

      newBooking.payment.remainingAmount = newBooking.pricing.total;

      await bookingRef.set(newBooking);

      return newBooking;
    } catch (error) {
      throw error;
    }
  }

  // Find booking by ID
  async findById(bookingId) {
    try {
      const doc = await this.collection.doc(bookingId).get();
      if (!doc.exists) return null;

      const booking = { id: doc.id, ...doc.data() };

      // Populate tour
      if (booking.tourId) {
        const TourModel = require("./tour.model");
        const tour = await TourModel.findById(booking.tourId);
        if (tour) {
          booking.tour = tour;
        }
      }

      // Populate user
      if (booking.userId) {
        const UserModel = require("./user.model");
        const user = await UserModel.findById(booking.userId);
        if (user) {
          booking.user = user;
        }
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  // Find booking by booking code
  async findByBookingCode(bookingCode) {
    try {
      const snapshot = await this.collection
        .where("bookingCode", "==", bookingCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  // Update booking
  async update(bookingId, updateData) {
    try {
      const bookingRef = this.collection.doc(bookingId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await bookingRef.update(updatePayload);

      const updatedDoc = await bookingRef.get();
      return updatedDoc.data();
    } catch (error) {
      throw error;
    }
  }

  // Delete booking
  async delete(bookingId) {
    try {
      await this.collection.doc(bookingId).delete();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get all bookings with pagination and filters
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        userId,
        tourId,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      let query = this.collection;

      // Apply filters
      if (status) {
        query = query.where("status", "==", status);
      }
      if (userId) {
        query = query.where("userId", "==", userId);
      }
      if (tourId) {
        query = query.where("tourId", "==", tourId);
      }

      // Apply sorting
      query = query.orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      const snapshot = await query.limit(limit).offset(offset).get();

      const bookings = [];
      snapshot.forEach((doc) => {
        const booking = { id: doc.id, ...doc.data() };

        // Filter by date range if specified
        if (startDate && booking.selectedDate.startDate < startDate) return;
        if (endDate && booking.selectedDate.startDate > endDate) return;

        bookings.push(booking);
      });

      return {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Update booking status
  async updateStatus(bookingId, status, changedBy, note = "") {
    try {
      const booking = await this.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const statusHistory = [
        ...booking.statusHistory,
        {
          status,
          changedAt: new Date().toISOString(),
          changedBy,
          note,
        },
      ];

      const updateData = {
        status,
        statusHistory,
        updatedBy: changedBy,
      };

      // Update confirmed/cancelled timestamps
      if (status === BOOKING_STATUS.CONFIRMED) {
        updateData.confirmedAt = new Date().toISOString();
      } else if (status === BOOKING_STATUS.CANCELLED) {
        updateData.cancelledAt = new Date().toISOString();
      }

      return await this.update(bookingId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Add payment transaction
  async addPaymentTransaction(bookingId, transactionData) {
    try {
      const booking = await this.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const transaction = {
        transactionId: transactionData.transactionId || `TXN${Date.now()}`,
        amount: transactionData.amount,
        method: transactionData.method,
        status: transactionData.status || PAYMENT_STATUS.COMPLETED,
        paidAt: new Date().toISOString(),
        note: transactionData.note || "",
      };

      const transactions = [...booking.payment.transactions, transaction];
      const paidAmount =
        booking.payment.paidAmount + (transactionData.amount || 0);
      const remainingAmount = booking.pricing.total - paidAmount;

      const updateData = {
        "payment.transactions": transactions,
        "payment.paidAmount": paidAmount,
        "payment.remainingAmount": remainingAmount,
      };

      // Check if deposit is paid
      if (
        !booking.payment.depositPaid &&
        paidAmount >= booking.payment.depositRequired
      ) {
        updateData["payment.depositPaid"] = true;
        updateData["payment.depositPaidAt"] = new Date().toISOString();
      }

      // Update payment status
      if (remainingAmount <= 0) {
        updateData["payment.status"] = PAYMENT_STATUS.COMPLETED;
      }

      return await this.update(bookingId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, cancelledBy, reason = "") {
    try {
      const booking = await this.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const updateData = {
        status: BOOKING_STATUS.CANCELLED,
        cancelledAt: new Date().toISOString(),
        "cancellation.isCancelled": true,
        "cancellation.cancelledAt": new Date().toISOString(),
        "cancellation.cancelledBy": cancelledBy,
        "cancellation.reason": reason,
      };

      // Add to status history
      const statusHistory = [
        ...booking.statusHistory,
        {
          status: BOOKING_STATUS.CANCELLED,
          changedAt: new Date().toISOString(),
          changedBy: cancelledBy,
          note: reason,
        },
      ];
      updateData.statusHistory = statusHistory;

      return await this.update(bookingId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Get booking statistics
  async getStatistics() {
    try {
      const snapshot = await this.collection.get();
      const bookings = [];
      snapshot.forEach((doc) => bookings.push(doc.data()));

      const stats = {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === BOOKING_STATUS.PENDING)
          .length,
        confirmed: bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED)
          .length,
        cancelled: bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED)
          .length,
        completed: bookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED)
          .length,
        totalRevenue: bookings
          .filter((b) => b.status !== BOOKING_STATUS.CANCELLED)
          .reduce((sum, b) => sum + b.pricing.total, 0),
        totalPaid: bookings.reduce((sum, b) => sum + b.payment.paidAmount, 0),
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BookingModel();

