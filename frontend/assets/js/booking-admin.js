class BookingManager {
  constructor() {
    this.apiBase = "/bookings/admin";
    this.pagination = {
      page: 1,
      limit: 10,
      totalPages: 1,
      total: 0,
    };
    this.filters = {
      status: "",
      search: "",
      startDate: "",
      endDate: "",
    };
  }

  // Initialize list page
  async initListPage() {
    // Load filters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tourId');
    const status = urlParams.get('status');
    
    if (tourId) this.filters.tourId = tourId;
    if (status) this.filters.status = status;

    // Set UI elements if they exist
    if (status && document.getElementById("filterStatus")) {
        document.getElementById("filterStatus").value = status;
    }

    this.bindEvents();
    await this.loadBookings();
  }

  // Initialize detail page
  async initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (!id) {
      AdminUtils.showToast("Booking ID not found", "error");
      setTimeout(() => (window.location.href = "index.html"), 2000);
      return;
    }

    await this.loadBookingDetail(id);
  }

  // Bind events for list page
  bindEvents() {
    // Search
    const searchInput = document.getElementById("searchBooking");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        AdminUtils.debounce((e) => {
          this.filters.search = e.target.value;
          this.pagination.page = 1;
          this.loadBookings();
        }, 500)
      );
    }

    // Filter Status
    const filterStatus = document.getElementById("filterStatus");
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        this.filters.status = e.target.value;
        this.pagination.page = 1;
        this.loadBookings();
      });
    }

    // Filter Date
    const filterDate = document.getElementById("filterDate");
    if (filterDate) {
      filterDate.addEventListener("change", (e) => {
        // Assuming date range picker or simple date input
        // For simplicity, let's assume it sets start/end in a hidden field or similar
        // Or user selects start and end separately.
        // Implementing simple single date filter or range if UI exists
      });
    }

    // Refresh
    const refreshBtn = document.getElementById("refreshBookings");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.loadBookings());
    }
  }

  // Load bookings list
  async loadBookings() {
    AdminUtils.showLoading("bookingsLoading");
    AdminUtils.hideElement("bookingsTable");

    try {
      const params = {
        page: this.pagination.page,
        limit: this.pagination.limit,
        ...this.filters,
      };

      // Since search might not be directly supported by backend as 'search' param, 
      // we might need to rely on what backend supports.
      // The backend supports: status, tourId, userId, startDate, endDate, sortBy, sortOrder
      // It doesn't seem to support generic 'search'.
      // We will trust the backend or updated backend later, but for now let's use what we have.
      // If backend doesn't support 'search', we might need to filter client side or ask backend update.
      // Current backend implementation of getAllBookings:
      // filters: status, tourId, userId, startDate, endDate.
      // No generic search.
      
      const query = AdminUtils.buildQueryParams(params);
      const Result = await API.request(`${this.apiBase}/all?${query}`);

      if (Result.success) {
        this.renderTable(Result.data);
        this.pagination = {
          ...this.pagination,
          page: Result.pagination.page,
          totalPages: Result.pagination.totalPages,
          total: Result.pagination.totalUsers || Result.pagination.total, // backend returns total
        };
        this.renderPagination();
      } else {
        AdminUtils.showToast(Result.message || "Failed to load bookings", "error");
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      AdminUtils.showToast("An error occurred while loading bookings", "error");
    } finally {
      AdminUtils.hideLoading("bookingsLoading");
      AdminUtils.showElement("bookingsTable");
    }
  }

  // Render bookings table
  renderTable(bookings) {
    const tbody = document.getElementById("bookingsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2"></i>
            No bookings found
          </td>
        </tr>
      `;
      return;
    }

    bookings.forEach((booking) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="fw-bold text-primary">#${booking.bookingCode}</div>
          <small class="text-muted"><i class="bi bi-clock"></i> ${AdminUtils.formatRelativeTime(booking.createdAt)}</small>
        </td>
        <td>
          <div class="fw-bold">${booking.customerInfo.fullName}</div>
          <small class="text-muted">${booking.customerInfo.email}</small> <br>
          <small class="text-muted">${booking.customerInfo.phone}</small>
        </td>
        <td>
          <div class="text-wrap" style="max-width: 200px;">
             ${booking.tour ? booking.tour.name : 'Tour Info Unavailable'}
          </div>
          <small class="text-muted"><i class="bi bi-calendar"></i> ${AdminUtils.formatDate(booking.selectedDate.startDate)}</small>
        </td>
        <td>
          <div class="fw-bold">${AdminUtils.formatCurrency(booking.pricing.total)}</div>
           <small class="${booking.payment.status === 'completed' ? 'text-success' : 'text-warning'}">
            ${booking.payment.status}
          </small>
        </td>
        <td>
          ${AdminUtils.createStatusBadge(booking.status)}
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <a href="detail/?id=${booking.id}" class="btn btn-outline-primary" title="View Details">
              <i class="bi bi-eye"></i>
            </a>
            <button class="btn btn-outline-success" onclick="bookingManager.updateStatus('${booking.id}', 'confirmed')" 
              ${booking.status === 'confirmed' || booking.status === 'cancelled' ? 'disabled' : ''} title="Confirm">
              <i class="bi bi-check-lg"></i>
            </button>
             <button class="btn btn-outline-danger" onclick="bookingManager.updateStatus('${booking.id}', 'cancelled')"
              ${booking.status === 'cancelled' || booking.status === 'completed' ? 'disabled' : ''} title="Cancel">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render pagination
  renderPagination() {
    const paginationEl = document.getElementById("bookingsPagination");
    AdminUtils.renderPagination(paginationEl, this.pagination, (page) => {
      this.pagination.page = page;
      this.loadBookings();
    });
  }

  // Update Status
  async updateStatus(id, status) {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return;

    try {
      const Result = await API.patch(`${this.apiBase}/${id}/status`, {
        status: status,
        note: `Status updated by Admin via Dashboard`,
      });

      if (Result.success) {
        AdminUtils.showToast(`Booking ${status} successfully`);
        this.loadBookings();
      } else {
        AdminUtils.showToast(Result.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      AdminUtils.showToast("An error occurred", "error");
    }
  }

  // Load Booking Detail
  async loadBookingDetail(id) {
    try {
        const Result = await API.request(`${this.apiBase}/${id}`);
        if(Result.success) {
            this.renderDetail(Result.data);
        } else {
             AdminUtils.showToast(Result.message || "Failed to load booking details", "error");
        }
    } catch (error) {
        console.error("Error loading detail:", error);
         AdminUtils.showToast("An error occurred", "error");
    }
  }

  // Show payment modal
  showPaymentModal() {
    this.paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    this.paymentModal.show();
  }

  // Submit payment
  async submitPayment() {
    const amount = document.getElementById('paymentAmount').value;
    const method = document.getElementById('paymentMethodInput').value;
    const note = document.getElementById('paymentNote').value;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (!amount || amount <= 0) {
      AdminUtils.showToast("Invalid amount", "error");
      return;
    }

    try {
        const result = await API.post(`${this.apiBase}/${id}/payment`, {
            amount: parseFloat(amount),
            method: method,
            note: note,
            transactionId: `TXN${Date.now()}` // Generate or allow input
        });

        if (result.success) {
            AdminUtils.showToast("Payment recorded successfully");
            this.paymentModal.hide();
            this.loadBookingDetail(id); // Reload details
        } else {
             AdminUtils.showToast(result.message || "Failed to record payment", "error");
        }
    } catch(error) {
         console.error("Payment error:", error);
         AdminUtils.showToast(error.message || "An error occurred", "error");
    }
  }

  renderDetail(booking) {
      // Populate fields
      document.getElementById('bookingCode').textContent = booking.bookingCode;
      document.getElementById('bookingStatus').innerHTML = AdminUtils.createStatusBadge(booking.status);
      document.getElementById('bookingDate').textContent = AdminUtils.formatDateTime(booking.createdAt);
      
      // Customer Info
      document.getElementById('custName').textContent = booking.customerInfo.fullName;
      document.getElementById('custEmail').textContent = booking.customerInfo.email;
      document.getElementById('custPhone').textContent = booking.customerInfo.phone;
      document.getElementById('custAddress').textContent = booking.customerInfo.address || 'N/A';
      document.getElementById('custNationality').textContent = booking.customerInfo.nationality;

      // Tour Info
      if(booking.tour) {
          document.getElementById('tourName').textContent = booking.tour.name;
          document.getElementById('tourStartDate').textContent = AdminUtils.formatDate(booking.selectedDate.startDate);
          
          let durationText = 'N/A';
          if (booking.tour.duration) {
              if (typeof booking.tour.duration === 'object') {
                  const { days, nights } = booking.tour.duration;
                  durationText = `${days || 0} Days, ${nights || 0} Nights`;
              } else {
                   durationText = `${booking.tour.duration} ${booking.tour.durationUnit || 'days'}`;
              }
          }
          document.getElementById('tourDuration').textContent = durationText;
          
          document.getElementById('participantsCount').textContent = `${booking.totalParticipants} (Adults: ${booking.numberOfAdults}, Children: ${booking.numberOfChildren})`;
      }

      // Payment Info
      document.getElementById('paymentMethod').textContent = booking.payment.method;
      document.getElementById('paymentStatus').textContent = booking.payment.status;
      
      // Deposit Info
      const depositEl = document.getElementById('depositStatus');
      const depositAmtEl = document.getElementById('depositAmount');
      if (depositEl && depositAmtEl) {
          depositEl.innerHTML = booking.payment.depositPaid 
            ? '<span class="badge bg-success">Paid</span>' 
            : '<span class="badge bg-warning text-dark">Unpaid</span>';
          depositAmtEl.textContent = `Required: ${AdminUtils.formatCurrency(booking.payment.depositRequired)} | Paid: ${AdminUtils.formatCurrency(booking.payment.paidAmount)}`;
          
          // Pre-fill payment modal amount if not paid
          if (!booking.payment.depositPaid) {
              const remainingDeposit = booking.payment.depositRequired - booking.payment.paidAmount;
              document.getElementById('paymentAmount').value = remainingDeposit > 0 ? remainingDeposit : '';
          }
      }

      const pricingHtml = `
        <div class="d-flex justify-content-between mb-2">
            <span>Adults (${booking.pricing.breakdown.adults.quantity} x ${AdminUtils.formatCurrency(booking.pricing.breakdown.adults.unitPrice)})</span>
            <span>${AdminUtils.formatCurrency(booking.pricing.breakdown.adults.total)}</span>
        </div>
        ${booking.pricing.breakdown.children.quantity > 0 ? `
        <div class="d-flex justify-content-between mb-2">
            <span>Children (${booking.pricing.breakdown.children.quantity} x ${AdminUtils.formatCurrency(booking.pricing.breakdown.children.unitPrice)})</span>
            <span>${AdminUtils.formatCurrency(booking.pricing.breakdown.children.total)}</span>
        </div>` : ''}
         <div class="d-flex justify-content-between mb-2 border-top pt-2 fw-bold">
            <span>Total</span>
            <span class="text-primary">${AdminUtils.formatCurrency(booking.pricing.total)}</span>
        </div>
      `;
      document.getElementById('pricingBreakdown').innerHTML = pricingHtml;

      // Status History
      const historyHtml = booking.statusHistory.map(h => `
        <div class="timeline-item mb-3">
             <div class="text-muted small">${AdminUtils.formatDateTime(h.changedAt)}</div>
             <div class="fw-bold">${h.status}</div>
             <div class="text-muted small">${h.note || ''}</div>
        </div>
      `).join('');
      document.getElementById('statusHistory').innerHTML = historyHtml;

      // Actions buttons
      const actionsDiv = document.getElementById('actionButtons');
      actionsDiv.innerHTML = `
        <button class="btn btn-success me-2" onclick="bookingManager.updateStatus('${booking.id}', 'confirmed')"
            ${booking.status === 'confirmed' || booking.status === 'cancelled' || !booking.payment.depositPaid ? 'disabled' : ''}
            title="${!booking.payment.depositPaid ? 'Deposit payment required' : ''}">
            <i class="bi bi-check-lg"></i> Confirm Booking
        </button>
        <button class="btn btn-danger" onclick="bookingManager.updateStatus('${booking.id}', 'cancelled')"
             ${booking.status === 'cancelled' || booking.status === 'completed' ? 'disabled' : ''}>
            <i class="bi bi-x-lg"></i> Cancel Booking
        </button>
      `;
  }
}

const bookingManager = new BookingManager();
