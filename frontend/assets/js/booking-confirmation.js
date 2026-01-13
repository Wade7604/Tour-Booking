// Booking Confirmation Page Logic
let bookingData = null;
let tourData = null;

// Get booking ID from URL
function getBookingIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("bookingId") || urlParams.get("id");
}

// Format currency
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Get status badge HTML
function getStatusBadge(status) {
  const statusMap = {
    pending: { text: "Pending", class: "btn-warning" },
    confirmed: { text: "Confirmed", class: "btn-success" },
    cancelled: { text: "Cancelled", class: "btn-danger" },
    completed: { text: "Completed", class: "btn-info" },
  };

  const statusInfo = statusMap[status] || {
    text: status,
    class: "btn-secondary",
  };
  return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Load booking details
async function loadBookingDetails() {
  const bookingId = getBookingIdFromUrl();

  if (!bookingId) {
    showError();
    return;
  }

  try {
    // Show loading
    document.getElementById("loadingSpinner").style.display = "flex";

    // Fetch booking details
    const response = await API.get(`/bookings/${bookingId}`);

    if (!response.success) {
      throw new Error(response.message || "Failed to load booking");
    }

    bookingData = response.data;

    // Fetch tour details
    try {
      const tourResponse = await API.get(`/tours/${bookingData.tourId}`);
      if (tourResponse.success) {
        tourData = tourResponse.data;
      }
    } catch (tourError) {
      console.error("Error loading tour details:", tourError);
    }

    // Display booking details
    displayBookingDetails();

    // Hide loading, show content
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("confirmationContent").style.display = "block";
  } catch (error) {
    console.error("Error loading booking:", error);
    showError();
  }
}

// Display booking details
function displayBookingDetails() {
  if (!bookingData) return;

  // Booking Code
  document.getElementById("bookingCode").textContent =
    bookingData.bookingCode || bookingData.id;

  // Customer Email
  document.getElementById("customerEmail").textContent =
    bookingData.customerInfo?.email || "-";
  document.getElementById("customerEmailDetail").textContent =
    bookingData.customerInfo?.email || "-";

  // Tour Information
  document.getElementById("tourName").textContent = tourData?.name || "-";
  document.getElementById("tourDuration").textContent = tourData
    ? `${tourData.duration?.days || 0}D${tourData.duration?.nights || 0}N`
    : "-";
  document.getElementById("departureDate").textContent = formatDate(
    bookingData.selectedDate?.startDate
  );
  document.getElementById("returnDate").textContent = formatDate(
    bookingData.selectedDate?.endDate
  );
  document.getElementById("totalParticipants").textContent =
    `${bookingData.totalParticipants || 0} people (${
      bookingData.numberOfAdults || 0
    } adults, ${bookingData.numberOfChildren || 0} children)`;
  document.getElementById("bookingStatus").innerHTML = getStatusBadge(
    bookingData.status
  );

  // Customer Information
  document.getElementById("customerName").textContent =
    bookingData.customerInfo?.fullName || "-";
  document.getElementById("customerPhone").textContent =
    bookingData.customerInfo?.phone || "-";
  document.getElementById("customerAddress").textContent =
    bookingData.customerInfo?.address || "N/A";

  // Payment Summary
  const pricing = bookingData.pricing || {};
  const payment = bookingData.payment || {};

  document.getElementById("subtotal").textContent = formatCurrency(
    pricing.subtotal
  );
  document.getElementById("totalAmount").textContent = formatCurrency(
    pricing.total
  );
  document.getElementById("depositPaid").textContent = formatCurrency(
    payment.paidAmount
  );
  document.getElementById("remainingAmount").textContent = formatCurrency(
    payment.remainingAmount
  );

  // Show discount if exists
  if (pricing.discount > 0) {
    document.getElementById("discountRow").style.display = "flex";
    document.getElementById("discount").textContent =
      "-" + formatCurrency(pricing.discount);
  }

  // Show tax if exists
  if (pricing.tax > 0) {
    document.getElementById("taxRow").style.display = "flex";
    document.getElementById("tax").textContent = formatCurrency(pricing.tax);
  }

  // Payment Status
  updatePaymentStatus();

  // Payment Deadline (7 days before tour)
  if (bookingData.selectedDate?.startDate) {
    const tourDate = new Date(bookingData.selectedDate.startDate);
    const paymentDeadline = new Date(tourDate);
    paymentDeadline.setDate(paymentDeadline.getDate() - 7);
    document.getElementById("paymentDeadline").textContent =
      formatDate(paymentDeadline);
  }
}

// Update payment status badge
function updatePaymentStatus() {
  const statusBadge = document.getElementById("paymentStatusBadge");
  const statusText = document.getElementById("paymentStatusText");
  const payment = bookingData.payment || {};

  if (payment.remainingAmount === 0) {
    statusBadge.className = "payment-status-badge status-paid";
    statusText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Fully Paid';
  } else if (payment.paidAmount > 0) {
    statusBadge.className = "payment-status-badge status-partial";
    statusText.innerHTML =
      '<i class="bi bi-info-circle"></i> Deposit paid, balance due';
  } else {
    statusBadge.className = "payment-status-badge status-pending";
    statusText.innerHTML =
      '<i class="bi bi-exclamation-circle"></i> Awaiting deposit payment';
  }
}

// Show error message
function showError() {
  document.getElementById("loadingSpinner").style.display = "none";
  document.getElementById("errorMessage").style.display = "block";
}

// ========================================
// AUTH CHECK
// ========================================
async function checkAuth() {
  try {
    const user = await AuthMiddleware.getCurrentUser();
    const authBtn = document.getElementById("authBtn");

    if (user) {
      authBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sign Out';
      authBtn.onclick = () => {
        if (confirm("Bạn có chắc muốn đăng xuất?")) {
          AuthMiddleware.logout();
        }
      };

      // Check admin access
      const hasAdminAccess = await AuthMiddleware.hasAnyPermission([
        "user:view",
        "role:view",
        "tour:create",
        "destination:create",
      ]);

      if (hasAdminAccess) {
        document.getElementById("adminNavItem").style.display = "block";
      }
    }
  } catch (error) {
    console.error("Auth check error:", error);
  }
}

function handleAuth() {
  window.location.href = "/login";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Clean URL - remove index.html from URL bar
  if (window.location.pathname.includes("index.html")) {
    const cleanUrl = window.location.href.replace("/index.html", "/");
    window.history.replaceState({}, document.title, cleanUrl);
  }

  checkAuth();
  loadBookingDetails();
});
