// My Bookings Page JavaScript

let currentPage = 1;
let currentStatus = "";
let totalPages = 1;
let allBookings = [];
let currentBooking = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadBookings();
  await AuthMiddleware.setupPermissionUI();
  updateAuthButton();
});

// Load bookings from API
async function loadBookings(page = 1, status = "") {
  try {
    showLoading(true);
    hideError();
    hideBookings();
    hideEmpty();

    currentPage = page;
    currentStatus = status;

    const params = {
      page: page,
      limit: 9,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    if (status) {
      params.status = status;
    }

    const response = await API.getMyBookings(params);

    if (response.success) {
      allBookings = response.data;
      const pagination = response.pagination;

      if (allBookings.length === 0) {
        showEmpty(true);
      } else {
        renderBookings(allBookings);
        setupPagination(pagination);
        showBookings(true);
      }
    } else {
      throw new Error(response.message || "Failed to load bookings");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    showError(error.message || "Failed to load bookings.");
  } finally {
    showLoading(false);
  }
}

// Render bookings grid
function renderBookings(bookings) {
  const grid = document.getElementById("bookingsGrid");
  grid.innerHTML = "";

  bookings.forEach((booking) => {
    const card = createBookingCard(booking);
    grid.appendChild(card);
  });
}

// Create booking card element
function createBookingCard(booking) {
  const card = document.createElement("div");
  card.className = "booking-card";
  card.onclick = () => showBookingDetail(booking.id);

  const statusClass = `status-${booking.status.toLowerCase()}`;
  const tourName = booking.tour?.name || "Tour information unavailable";
  const startDate = formatDate(booking.selectedDate?.startDate);
  const endDate = formatDate(booking.selectedDate?.endDate);
  const totalAmount = formatPrice(booking.pricing?.total || 0);
  const participants = booking.totalParticipants || 0;

  card.innerHTML = `
    <div class="booking-card-header">
      <div class="booking-code">
        <i class="bi bi-receipt"></i> ${booking.bookingCode}
      </div>
      <span class="booking-status-badge ${statusClass}">
        ${booking.status}
      </span>
    </div>
    <div class="booking-card-body">
      <h3 class="tour-name">${tourName}</h3>
      
      <div class="booking-info-row">
        <i class="bi bi-calendar-event"></i>
        <span><strong>Departure:</strong> ${startDate}</span>
      </div>
      
      <div class="booking-info-row">
        <i class="bi bi-calendar-check"></i>
        <span><strong>Return:</strong> ${endDate}</span>
      </div>
      
      <div class="booking-info-row">
        <i class="bi bi-people-fill"></i>
        <span><strong>Participants:</strong> ${participants} people</span>
      </div>
      
      <div class="booking-total">
        <span class="total-label">Total Amount</span>
        <span class="total-amount">${totalAmount}</span>
      </div>
    </div>
  `;

  return card;
}

// Show booking detail modal
async function showBookingDetail(bookingId) {
  try {
    const booking = allBookings.find((b) => b.id === bookingId);
    if (!booking) {
      // Fetch from API if not in current list
      const response = await API.getBookingById(bookingId);
      if (response.success) {
        currentBooking = response.data;
      } else {
        throw new Error("Booking not found");
      }
    } else {
      currentBooking = booking;
    }

    renderBookingDetail(currentBooking);

    // Show/hide cancel button based on status
    const cancelBtn = document.getElementById("cancelBookingBtn");
    if (currentBooking.status === "pending" || currentBooking.status === "confirmed") {
      cancelBtn.style.display = "block";
    } else {
      cancelBtn.style.display = "none";
    }

    const modal = new bootstrap.Modal(document.getElementById("bookingDetailModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading booking detail:", error);
    alert("Failed to load booking details.");
  }
}

// Render booking detail in modal
function renderBookingDetail(booking) {
  const content = document.getElementById("bookingDetailContent");

  const tourName = booking.tour?.name || "Tour information unavailable";
  const startDate = formatDate(booking.selectedDate?.startDate);
  const endDate = formatDate(booking.selectedDate?.endDate);

  let participantsHTML = "";
  if (booking.participants && booking.participants.length > 0) {
    participantsHTML = booking.participants
      .map(
        (p) => `
      <div class="participant-card">
        <div class="participant-name">${p.fullName || "N/A"}</div>
        <div class="participant-type">${p.type || "Adult"}</div>
      </div>
    `
      )
      .join("");
  } else {
    participantsHTML = `<p class="text-muted">No participant details available</p>`;
  }

  content.innerHTML = `
    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-info-circle"></i> Booking Information
      </h4>
      <div class="detail-row">
        <span class="detail-label">Booking Code</span>
        <span class="detail-value"><strong>${booking.bookingCode}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">
          <span class="booking-status-badge status-${booking.status.toLowerCase()}">
            ${booking.status}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking Date</span>
        <span class="detail-value">${formatDate(booking.createdAt)}</span>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-geo-alt"></i> Tour Details
      </h4>
      <div class="detail-row">
        <span class="detail-label">Tour Name</span>
        <span class="detail-value">${tourName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Departure Date</span>
        <span class="detail-value">${startDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Return Date</span>
        <span class="detail-value">${endDate}</span>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-person"></i> Customer Information
      </h4>
      <div class="detail-row">
        <span class="detail-label">Full Name</span>
        <span class="detail-value">${booking.customerInfo?.fullName || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${booking.customerInfo?.email || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone</span>
        <span class="detail-value">${booking.customerInfo?.phone || "N/A"}</span>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-people-fill"></i> Participants
      </h4>
      <div class="detail-row">
        <span class="detail-label">Adults</span>
        <span class="detail-value">${booking.numberOfAdults || 0}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Children</span>
        <span class="detail-value">${booking.numberOfChildren || 0}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Infants</span>
        <span class="detail-value">${booking.numberOfInfants || 0}</span>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-people"></i> Participant Details
      </h4>
      ${participantsHTML}
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-cash"></i> Payment Summary
      </h4>
      <div class="detail-row">
        <span class="detail-label">Subtotal</span>
        <span class="detail-value">${formatPrice(booking.pricing?.subtotal || 0)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tax</span>
        <span class="detail-value">${formatPrice(booking.pricing?.tax || 0)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Discount</span>
        <span class="detail-value">-${formatPrice(booking.pricing?.discount || 0)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label"><strong>Total Amount</strong></span>
        <span class="detail-value"><strong>${formatPrice(booking.pricing?.total || 0)}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Paid Amount</span>
        <span class="detail-value text-success">${formatPrice(booking.payment?.paidAmount || 0)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Remaining</span>
        <span class="detail-value text-danger">${formatPrice(booking.payment?.remainingAmount || 0)}</span>
      </div>
    </div>

    ${
      booking.specialRequests
        ? `
    <div class="detail-section">
      <h4 class="detail-section-title">
        <i class="bi bi-chat-left-text"></i> Special Requests
      </h4>
      <p>${booking.specialRequests}</p>
    </div>
    `
        : ""
    }
  `;
}

// Filter bookings by status
function filterByStatus(status) {
  // Update active tab
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  // Load bookings with filter
  loadBookings(1, status);
}

// Pagination
function setupPagination(pagination) {
  totalPages = pagination.totalPages || 1;
  currentPage = pagination.page || 1;

  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;

  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  document.getElementById("paginationContainer").style.display =
    totalPages > 1 ? "flex" : "none";
}

function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    loadBookings(newPage, currentStatus);
  }
}

// Cancel booking
function confirmCancelBooking() {
  if (
    !confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone."
    )
  ) {
    return;
  }

  const reason = prompt("Please provide a reason for cancellation (optional):");

  cancelBooking(currentBooking.id, reason);
}

async function cancelBooking(bookingId, reason = "") {
  try {
    const response = await API.cancelBooking(bookingId, { reason });

    if (response.success) {
      alert("Booking cancelled successfully!");
      bootstrap.Modal.getInstance(
        document.getElementById("bookingDetailModal")
      ).hide();
      loadBookings(currentPage, currentStatus);
    } else {
      throw new Error(response.message || "Failed to cancel booking");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert(error.message || "Failed to cancel booking. Please try again.");
  }
}

// Utility Functions
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// UI Helper Functions
function showLoading(show) {
  document.getElementById("loadingSpinner").style.display = show ? "flex" : "none";
}

function showBookings(show) {
  document.getElementById("bookingsGrid").style.display = show ? "grid" : "none";
}

function showEmpty(show) {
  document.getElementById("emptyState").style.display = show ? "block" : "none";
}

function hideBookings() {
  document.getElementById("bookingsGrid").style.display = "none";
}

function hideEmpty() {
  document.getElementById("emptyState").style.display = "none";
}

function showError(message) {
  document.getElementById("errorText").textContent = message;
  document.getElementById("errorMessage").style.display = "block";
}

function hideError() {
  document.getElementById("errorMessage").style.display = "none";
}

// Auth button handler
function updateAuthButton() {
  const token = localStorage.getItem("idToken");
  const authBtn = document.getElementById("authBtn");

  if (token) {
    authBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sign out';
    authBtn.onclick = logout;
  } else {
    authBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
    authBtn.onclick = () => (window.location.href = "/login");
  }
}

function handleAuth() {
  const token = localStorage.getItem("idToken");
  if (token) {
    logout();
  } else {
    window.location.href = "/login";
  }
}
