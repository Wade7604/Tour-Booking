const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Load and render email template
  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/emails",
        `${templateName}.html`
      );
      let template = await fs.readFile(templatePath, "utf-8");

      // Simple template replacement (you can use handlebars for more complex templates)
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        template = template.replace(regex, data[key] || "");
      });

      // Handle conditional blocks (simple implementation)
      template = template.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, (match) => {
        const condition = match.match(/{{#if (\w+)}}/)[1];
        if (data[condition]) {
          return match
            .replace(/{{#if \w+}}/, "")
            .replace(/{{\/if}}/, "");
        }
        return "";
      });

      return template;
    } catch (error) {
      console.error("Error rendering email template:", error);
      throw error;
    }
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN").format(amount);
  }

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  // Format datetime
  formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  // Send booking confirmation email
  async sendBookingConfirmation(booking, tour) {
    try {
      const data = {
        bookingCode: booking.bookingCode,
        customerName: booking.customerInfo.fullName,
        customerEmail: booking.customerInfo.email,
        customerPhone: booking.customerInfo.phone,
        tourName: tour.name,
        tourImage: tour.images && tour.images.length > 0 ? tour.images[0] : "",
        startDate: this.formatDate(booking.selectedDate.startDate),
        endDate: this.formatDate(booking.selectedDate.endDate),
        duration: tour.duration 
          ? `${tour.duration.days || 0} Days, ${tour.duration.nights || 0} Nights` 
          : "N/A",
        totalParticipants: booking.totalParticipants,
        numberOfAdults: booking.numberOfAdults,
        numberOfChildren: booking.numberOfChildren,
        totalAmount: this.formatCurrency(booking.pricing.total),
        paidAmount: this.formatCurrency(booking.payment.paidAmount),
        remainingAmount: this.formatCurrency(booking.payment.remainingAmount),
        status: this.getStatusText(booking.status),
        paymentDeadline: this.formatDate(
          new Date(
            new Date(booking.selectedDate.startDate).getTime() -
              7 * 24 * 60 * 60 * 1000
          )
        ), // 7 days before tour
        bookingDetailUrl: `${process.env.FRONTEND_URL}/booking/confirmation/?bookingId=${booking.id}`,
      };

      const html = await this.renderTemplate("booking-confirmation", data);

      const mailOptions = {
        from: `"TourBooking" <${process.env.SMTP_USER}>`,
        to: booking.customerInfo.email,
        subject: `Xác nhận đặt tour - ${booking.bookingCode}`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Booking confirmation email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending booking confirmation email:", error);
      throw error;
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(booking, tour, transaction) {
    try {
      const data = {
        transactionId: transaction.transactionId,
        bookingCode: booking.bookingCode,
        amount: this.formatCurrency(transaction.amount),
        paymentMethod: this.getPaymentMethodText(transaction.method),
        paidAt: this.formatDateTime(transaction.paidAt),
        remainingAmount: this.formatCurrency(booking.payment.remainingAmount),
        isFullyPaid: booking.payment.remainingAmount <= 0,
        tourName: tour.name,
        tourImage: tour.images && tour.images.length > 0 ? tour.images[0] : "",
        startDate: this.formatDate(booking.selectedDate.startDate),
        totalParticipants: booking.totalParticipants,
        bookingDetailUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      };

      const html = await this.renderTemplate("payment-confirmation", data);

      const mailOptions = {
        from: `"TourBooking" <${process.env.SMTP_USER}>`,
        to: booking.customerInfo.email,
        subject: `Xác nhận thanh toán - ${transaction.transactionId}`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Payment confirmation email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending payment confirmation email:", error);
      throw error;
    }
  }

  // Send booking cancellation email
  async sendBookingCancellation(booking, tour, refundInfo) {
    try {
      const data = {
        bookingCode: booking.bookingCode,
        cancellationReason: booking.cancellation.reason || "Không có lý do",
        paidAmount: this.formatCurrency(booking.payment.paidAmount),
        refundAmount: this.formatCurrency(refundInfo.refundAmount),
        refundPolicy: refundInfo.refundPolicy,
        tourName: tour.name,
        startDate: this.formatDate(booking.selectedDate.startDate),
        totalParticipants: booking.totalParticipants,
      };

      const html = await this.renderTemplate("booking-cancellation", data);

      const mailOptions = {
        from: `"TourBooking" <${process.env.SMTP_USER}>`,
        to: booking.customerInfo.email,
        subject: `Xác nhận hủy booking - ${booking.bookingCode}`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Cancellation email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending cancellation email:", error);
      throw error;
    }
  }

  // Helper: Get status text in Vietnamese
  getStatusText(status) {
    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      cancelled: "Đã hủy",
      completed: "Đã hoàn thành",
      refunded: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
  }

  // Helper: Get payment method text in Vietnamese
  getPaymentMethodText(method) {
    const methodMap = {
      bank_transfer: "Chuyển khoản ngân hàng",
      credit_card: "Thẻ tín dụng",
      cash: "Tiền mặt",
      vnpay: "VNPay",
      momo: "MoMo",
    };
    return methodMap[method] || method;
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Email service is ready to send emails");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
