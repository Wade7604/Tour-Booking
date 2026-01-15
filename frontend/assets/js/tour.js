// Tour API Service
class TourAPI {
  constructor() {
    this.baseURL = "/tours";
  }

  // Helper: Build query string from params
  buildQueryString(params = {}) {
    const filtered = Object.entries(params)
      .filter(
        ([_, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
    return filtered ? `?${filtered}` : "";
  }

  // Get all tours
  async getAll(params = {}) {
    const queryString = this.buildQueryString(params);
    return await API.get(`${this.baseURL}${queryString}`);
  }

  // Get tour by ID
  async getById(id) {
    return await API.get(`${this.baseURL}/${id}`);
  }

  // Get tour by slug
  async getBySlug(slug) {
    return await API.get(`${this.baseURL}/slug/${slug}`);
  }

  // Search tours
  async search(query, params = {}) {
    const queryString = this.buildQueryString({ q: query, ...params });
    return await API.get(`${this.baseURL}/search${queryString}`);
  }

  // Get tours by destination
  async getByDestination(destinationId, params = {}) {
    const queryString = this.buildQueryString(params);
    return await API.get(
      `${this.baseURL}/destination/${destinationId}${queryString}`
    );
  }

  // Get tour statistics
  async getStatistics() {
    return await API.get(`${this.baseURL}/statistics/overview`);
  }

  // Create tour
  async create(tourData) {
    return await API.post(this.baseURL, tourData);
  }

  // Update tour
  async update(id, tourData) {
    return await API.put(`${this.baseURL}/${id}`, tourData);
  }

  // Delete tour
  async delete(id) {
    return await API.delete(`${this.baseURL}/${id}`);
  }

  // Update tour status
  async updateStatus(id, status) {
    return await API.patch(`${this.baseURL}/${id}/status`, { status });
  }

  // Add images
  async addImages(id, images) {
    return await API.post(`${this.baseURL}/${id}/images`, { images });
  }

  // Remove image
  async removeImage(id, imageUrl) {
    return await API.delete(
      `${this.baseURL}/${id}/images/${encodeURIComponent(imageUrl)}`
    );
  }

  // Upload tour images (API)
  async uploadImages(id, files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    return await API.uploadRequest(`/uploads/tours/${id}/images`, formData);
  }

  // Delete tour image (API)
  async deleteImage(id, publicId) {
    return await API.request(`/uploads/tours/${id}/image`, {
      method: "DELETE",
      body: JSON.stringify({ publicId }),
    });
  }

  // Set cover image
  async setCoverImage(id, coverImage) {
    return await API.patch(`${this.baseURL}/${id}/cover-image`, { coverImage });
  }

  // Add available date
  async addAvailableDate(id, dateData) {
    return await API.post(`${this.baseURL}/${id}/dates`, dateData);
  }

  // Update available date
  async updateAvailableDate(id, dateIndex, dateData) {
    return await API.put(`${this.baseURL}/${id}/dates/${dateIndex}`, dateData);
  }

  // Remove available date
  async removeAvailableDate(id, dateIndex) {
    return await API.delete(`${this.baseURL}/${id}/dates/${dateIndex}`);
  }

  // Helper: Generate slug from name
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize("NFD") // Decompose combined graphemes
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[đĐ]/g, "d") // Handle Vietnamese 'd'
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Helper: Format price
  formatPrice(price, currency = "VND") {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  }

  // Helper: Format duration
  formatDuration(duration) {
    return `${duration.days} ngày ${duration.nights} đêm`;
  }
}

// Export singleton instance
const tourAPI = new TourAPI();

// Tour Admin Controller
class TourAdminController {
  constructor() {
    this.currentPage = 1;
    this.currentFilters = {};
    this.tourModal = null;
    this.currentTourId = null;
    this.tourAvailableDates = [];
  }

  // Initialize
  async init() {
    const user = await AuthMiddleware.getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    await AuthMiddleware.setupPermissionUI();
    this.tourModal = new bootstrap.Modal(document.getElementById("tourModal"));

    this.loadDestinations();
    this.loadStatistics();
    this.loadTours();
    this.setupEventListeners();
  }

  // Load destinations for dropdown
  async loadDestinations() {
    try {
      const response = await API.get("/destinations?limit=100&status=active");
      const result = response.data || response;
      const destinations = Array.isArray(result)
        ? result
        : result.destinations || [];

      const select = document.getElementById("tourDestination");
      select.innerHTML =
        '<option value="">Select destination (optional)</option>';

      destinations.forEach((dest) => {
        const option = document.createElement("option");
        option.value = dest.id;
        option.textContent = `${dest.name} (${dest.city}, ${dest.country})`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading destinations:", error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener(
      "input",
      AdminUtils.debounce(() => {
        this.currentPage = 1;
        this.loadTours();
      }, 500)
    );

    // Filters
    ["statusFilter", "difficultyFilter", "typeFilter"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => {
        this.currentPage = 1;
        this.loadTours();
      });
    });

    // Auto-generate slug
    document.getElementById("tourName").addEventListener("input", (e) => {
      document.getElementById("tourSlug").value = tourAPI.generateSlug(
        e.target.value
      );
    });
  }

  // Load statistics
  async loadStatistics() {
    try {
      const response = await tourAPI.getStatistics();
      const stats = response.data || response;
      AdminUtils.animateCounter(
        document.getElementById("totalTours"),
        stats.total || 0
      );
      AdminUtils.animateCounter(
        document.getElementById("activeTours"),
        stats.active || 0
      );
      AdminUtils.animateCounter(
        document.getElementById("featuredTours"),
        stats.featured || 0
      );
      AdminUtils.animateCounter(
        document.getElementById("draftTours"),
        stats.draft || 0
      );
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }

  // Load tours
  async loadTours() {
    AdminUtils.showLoading("loadingSpinner");
    document.getElementById("toursTableBody").innerHTML = "";

    try {
      const params = {
        page: this.currentPage,
        limit: 10,
        status: document.getElementById("statusFilter").value,
        difficulty: document.getElementById("difficultyFilter").value,
        tourType: document.getElementById("typeFilter").value,
      };

      const searchTerm = document.getElementById("searchInput").value.trim();
      let response;

      if (searchTerm) {
        response = await tourAPI.search(searchTerm, params);
      } else {
        response = await tourAPI.getAll(params);
      }

      const result = response.data || response;
      this.displayTours(result.tours || []);

      const pagination = result.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
      this.displayPagination(pagination);

      // Update showing text
      const total = pagination.total;
      const page = pagination.page;
      const limit = pagination.limit;
      const from = total === 0 ? 0 : (page - 1) * limit + 1;
      const to = Math.min(page * limit, total);

      const fromEl = document.getElementById("showingFrom");
      if (fromEl) fromEl.textContent = from;

      const toEl = document.getElementById("showingTo");
      if (toEl) toEl.textContent = to;

      const totalEl = document.getElementById("totalResults");
      if (totalEl) totalEl.textContent = total;

      const countEl = document.getElementById("resultCount");
      if (countEl) countEl.textContent = `${total} results`;
    } catch (error) {
      console.error("Error loading tours:", error);
      AdminUtils.showToast("Failed to load tours", "danger");
    } finally {
      AdminUtils.hideLoading("loadingSpinner");
    }
  }

  // Display tours
  displayTours(tours) {
    const tbody = document.getElementById("toursTableBody");
    if (!tours || tours.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center">No tours found</td></tr>';
      return;
    }

    tbody.innerHTML = tours
      .map(
        (tour) => `
      <tr>
        <td>
          <strong>${AdminUtils.escapeHtml(tour.name)}</strong><br>
          <small class="text-muted">${tourAPI.formatDuration(
            tour.duration
          )}</small>
        </td>
        <td>${tour.duration.days}D/${tour.duration.nights}N</td>
        <td>${tourAPI.formatPrice(tour.price.adult)}</td>
        <td>
          <span class="badge bg-${this.getDifficultyColor(tour.difficulty)}">
            ${tour.difficulty}
          </span>
        </td>
        <td>
          <span class="badge bg-secondary">${tour.tourType}</span>
        </td>
        <td>
          ${AdminUtils.createStatusBadge(tour.status)}
          ${tour.featured ? '<i class="bi bi-star-fill text-warning"></i>' : ""}
        </td>
        <td>
          <button class="btn btn-outline-info" 
                  onclick="controller.viewTour('${tour.id}')" 
                  title="View Details"
                  style="position: relative; z-index: 999; pointer-events: auto; cursor: pointer;">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-primary" 
                  onclick="controller.editTour('${tour.id}')" 
                  title="Edit"
                  style="position: relative; z-index: 999; pointer-events: auto; cursor: pointer;">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger" 
                  onclick="controller.deleteTour('${tour.id}')" 
                  title="Delete"
                  style="position: relative; z-index: 999; pointer-events: auto; cursor: pointer;">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // Display pagination
  displayPagination(pagination) {
    AdminUtils.renderPagination(
      document.getElementById("paginationContainer"),
      pagination,
      (page) => {
        this.currentPage = page;
        this.loadTours();
      }
    );
  }

  // Toggle modal read-only state
  toggleModalReadOnly(isReadOnly) {
    const form = document.getElementById("tourForm");
    const inputs = form.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      if (isReadOnly) {
        input.setAttribute("disabled", "true");
      } else {
        input.removeAttribute("disabled");
      }
    });

    const saveBtn = document.getElementById("saveTourBtn");
    if (saveBtn) saveBtn.style.display = isReadOnly ? "none" : "block";

    const imgInput = document.getElementById("tourImageInput");
    if (imgInput) imgInput.disabled = isReadOnly;

    const uploadBtn = document.querySelector("#imageUploadSection button");
    if (uploadBtn) uploadBtn.disabled = isReadOnly;

    const deleteBtns = document.querySelectorAll("#tourImagesPreview button");
    deleteBtns.forEach(
      (btn) => (btn.style.display = isReadOnly ? "none" : "block")
    );

    const addDateBtn = document.querySelector("#addDateSection button");
    if (addDateBtn) addDateBtn.disabled = isReadOnly;

    const removeDateBtns = document.querySelectorAll("#tourDatesList button");
    removeDateBtns.forEach((btn) => (btn.disabled = isReadOnly));
  }

  // Show create modal
  openCreateModal() {
    this.currentTourId = null;
    document.getElementById("tourModalTitle").textContent = "Create New Tour";
    document.getElementById("tourForm").reset();
    document.getElementById("tourId").value = "";

    this.toggleModalReadOnly(false);

    document.getElementById("tourImagesPreview").innerHTML =
      '<p class="text-muted">Save tour first to upload images</p>';
    this.tourAvailableDates = [];
    this.renderTourDates();

    this.tourModal.show();
  }

  // View tour details
  async viewTour(id) {
    try {
      AdminUtils.showLoading("loadingSpinner");
      const response = await tourAPI.getById(id);
      const tour = response.data || response;

      this.currentTourId = tour.id;
      this.populateTourForm(tour);

      document.getElementById("tourModalTitle").textContent =
        "Tour Details (Read Only)";
      this.toggleModalReadOnly(true);

      this.tourModal.show();
    } catch (error) {
      console.error("Error viewing tour:", error);
      AdminUtils.showToast("Failed to load tour details", "danger");
    } finally {
      AdminUtils.hideLoading("loadingSpinner");
    }
  }

  // Edit tour
  async editTour(id) {
    try {
      AdminUtils.showLoading("loadingSpinner");
      const response = await tourAPI.getById(id);
      const tour = response.data || response;
      this.currentTourId = id;

      document.getElementById("tourModalTitle").textContent = "Edit Tour";
      this.toggleModalReadOnly(false);

      this.populateTourForm(tour);
      this.tourModal.show();
    } catch (error) {
      console.error("Error loading tour:", error);
      AdminUtils.showToast("Failed to load tour details", "danger");
    } finally {
      AdminUtils.hideLoading("loadingSpinner");
    }
  }

  // Populate form helper
  populateTourForm(tour) {
    document.getElementById("tourId").value = tour.id || "";
    document.getElementById("tourName").value = tour.name || "";
    document.getElementById("tourSlug").value = tour.slug || "";
    document.getElementById("tourDescription").value = tour.description || "";
    document.getElementById("tourDestination").value = tour.destinationId || "";

    document.getElementById("tourDays").value = tour.duration?.days || 1;
    document.getElementById("tourNights").value = tour.duration?.nights || 0;
    document.getElementById("priceAdult").value = tour.price?.adult || 0;
    document.getElementById("priceChild").value = tour.price?.children || 0;

    document.getElementById("maxGroupSize").value = tour.maxGroupSize || 20;
    document.getElementById("minGroupSize").value = tour.minGroupSize || 1;
    document.getElementById("tourDifficulty").value =
      tour.difficulty || "medium";
    document.getElementById("tourType").value = tour.tourType || "classic";
    document.getElementById("tourStatus").value = tour.status || "draft";
    document.getElementById("tourFeatured").checked = tour.featured || false;

    document.getElementById("tourIncludes").value = (tour.includes || []).join(
      "\n"
    );
    document.getElementById("tourExcludes").value = (tour.excludes || []).join(
      "\n"
    );
    document.getElementById("tourRequirements").value = (
      tour.requirements || []
    ).join("\n");

    // Populate itinerary - generate fields first, then fill them
    if (tour.itinerary && tour.itinerary.length > 0) {
      // Auto-generate itinerary fields
      generateItineraryDays();

      // Wait a bit for DOM to update, then populate
      setTimeout(() => {
        tour.itinerary.forEach((day) => {
          const titleInput = document.getElementById(`day${day.day}Title`);
          const activitiesInput = document.getElementById(
            `day${day.day}Activities`
          );

          if (titleInput && activitiesInput) {
            titleInput.value = day.title || "";
            // Join activities with newline and add bullet points
            activitiesInput.value = (day.activities || [])
              .map((activity) => `- ${activity}`)
              .join("\n");
          }
        });
      }, 100);
    }

    if (tour.images && tour.images.length > 0) {
      const images = tour.images.map((url) => {
        return typeof url === "string"
          ? { url, publicId: url.split("/").pop().split(".")[0] }
          : url;
      });
      this.displayTourImages(images);
    } else {
      document.getElementById("tourImagesPreview").innerHTML =
        '<p class="text-muted">No images available</p>';
    }

    this.tourAvailableDates = tour.availableDates || [];
    this.renderTourDates();
  }

  // Save tour
  async saveTour() {
    const form = document.getElementById("tourForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const tourData = {
      name: document.getElementById("tourName").value,
      slug: document.getElementById("tourSlug").value,
      description: document.getElementById("tourDescription").value,
      destinationId: document.getElementById("tourDestination").value || null,
      duration: {
        days: parseInt(document.getElementById("tourDays").value),
        nights: parseInt(document.getElementById("tourNights").value),
      },
      price: {
        adult: parseFloat(document.getElementById("priceAdult").value),
        child: parseFloat(document.getElementById("priceChild").value) || 0,
        infant: 0,
        currency: "VND",
      },
      maxGroupSize: parseInt(document.getElementById("maxGroupSize").value),
      minGroupSize: parseInt(document.getElementById("minGroupSize").value),
      difficulty: document.getElementById("tourDifficulty").value,
      tourType: document.getElementById("tourType").value,
      status: document.getElementById("tourStatus").value,
      featured: document.getElementById("tourFeatured").checked,
      includes: document
        .getElementById("tourIncludes")
        .value.split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      excludes: document
        .getElementById("tourExcludes")
        .value.split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      requirements: document
        .getElementById("tourRequirements")
        .value.split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      itinerary: this.collectItineraryData(),
      destinations: [],
      availableDates: this.tourAvailableDates || [],
    };

    try {
      let result;
      if (this.currentTourId) {
        result = await tourAPI.update(this.currentTourId, tourData);
        AdminUtils.showToast("Tour updated successfully!", "success");
      } else {
        result = await tourAPI.create(tourData);
        const createdTour = result.data || result;
        this.currentTourId = createdTour.id;
        document.getElementById("tourId").value = this.currentTourId;
        document.getElementById("tourModalTitle").textContent = "Edit Tour";
        AdminUtils.showToast(
          "Tour created! You can now upload images.",
          "success"
        );
      }

      this.loadStatistics();
      this.loadTours();
    } catch (error) {
      console.error("Error saving tour:", error);
      AdminUtils.showToast("Failed to save tour", "danger");
    }
  }

  // Collect itinerary data from dynamic fields
  collectItineraryData() {
    const days = parseInt(document.getElementById("tourDays").value) || 0;
    const itinerary = [];

    for (let i = 1; i <= days; i++) {
      const titleInput = document.getElementById(`day${i}Title`);
      const activitiesInput = document.getElementById(`day${i}Activities`);

      if (titleInput && activitiesInput) {
        const title = titleInput.value.trim();
        const activitiesText = activitiesInput.value.trim();

        if (title && activitiesText) {
          // Parse activities - split by newline and clean up
          const activities = activitiesText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
              // Remove leading bullet points (-, •, *, etc.)
              return line.replace(/^[-•*]\s*/, "");
            });

          itinerary.push({
            day: i,
            title: title,
            activities: activities,
          });
        }
      }
    }

    return itinerary;
  }

  // Delete tour
  async deleteTour(id) {
    if (
      !confirm(
        "Are you sure you want to delete this tour? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      AdminUtils.showLoading("loadingSpinner");
      await tourAPI.delete(id);
      AdminUtils.showToast("Tour deleted successfully", "success");
      this.loadTours();
    } catch (error) {
      console.error("Error deleting tour:", error);
      AdminUtils.showToast("Failed to delete tour", "danger");
    } finally {
      AdminUtils.hideLoading("loadingSpinner");
    }
  }

  // Reset filters
  resetFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("difficultyFilter").value = "";
    document.getElementById("typeFilter").value = "";
    this.currentPage = 1;
    this.loadTours();
  }

  // Get difficulty color helper
  getDifficultyColor(difficulty) {
    const colors = {
      easy: "success",
      moderate: "warning",
      challenging: "danger",
    };
    return colors[difficulty] || "secondary";
  }
  // Upload tour images
  async uploadTourImages() {
    const fileInput = document.getElementById("tourImageInput");
    const files = fileInput.files;

    if (!files || files.length === 0) {
      AdminUtils.showToast("Please select images to upload", "warning");
      return;
    }

    if (!this.currentTourId) {
      AdminUtils.showToast(
        "Please save the tour first before uploading images",
        "warning"
      );
      return;
    }

    try {
      // Show loading
      AdminUtils.showLoading("loadingSpinner");

      const result = await tourAPI.uploadImages(this.currentTourId, files);

      if (result.success) {
        AdminUtils.showToast(
          `${files.length} image(s) uploaded successfully!`,
          "success"
        );

        // Lấy mảng images đầy đủ từ response
        const data = result.data || result;
        const allImages = data.allImages || data.tour?.images || [];

        if (allImages.length > 0) {
          // Format images để hiển thị
          const formattedImages = allImages.map((img) => {
            if (typeof img === "object" && img.url) {
              return img;
            }
            if (typeof img === "string") {
              // Extract publicId from URL
              // Example: https://res.cloudinary.com/.../tours/tourId/abc123.jpg
              const urlParts = img.split("/");
              const filename = urlParts[urlParts.length - 1];
              const publicId = filename.split(".")[0];
              // Full publicId might be: tours/tourId/abc123
              const fullPublicId =
                urlParts.slice(-3, -1).join("/") + "/" + publicId;

              return {
                url: img,
                publicId: fullPublicId || publicId,
              };
            }
            return img;
          });

          this.displayTourImages(formattedImages);
        } else {
          document.getElementById("tourImagesPreview").innerHTML =
            '<p class="text-muted">No images available</p>';
        }

        // Clear file input
        fileInput.value = "";
      } else {
        AdminUtils.showToast(
          result.message || "Failed to upload images",
          "danger"
        );
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      AdminUtils.showToast("Failed to upload images", "danger");
    } finally {
      AdminUtils.hideLoading("loadingSpinner");
    }
  }

  // Display tour images
  displayTourImages(images) {
    const container = document.getElementById("tourImagesPreview");
    container.innerHTML = "";

    if (!images || images.length === 0) {
      container.innerHTML = '<p class="text-muted">No images uploaded yet</p>';
      return;
    }

    images.forEach((img, index) => {
      const col = document.createElement("div");
      col.className = "col-md-3";
      col.innerHTML = `
        <div class="card">
          <img src="${img.url}" class="card-img-top" alt="Tour image ${
        index + 1
      }" style="height: 150px; object-fit: cover;">
          <div class="card-body p-2">
            <button type="button" class="btn btn-danger btn-sm w-100" onclick="controller.deleteTourImage('${
              img.publicId
            }')">
              <i class="bi bi-trash"></i> Delete
            </button>
            ${
              index === 0
                ? '<small class="text-muted d-block mt-1">Cover Image</small>'
                : ""
            }
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  }

  // Delete tour image
  async deleteTourImage(publicId) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    if (!this.currentTourId) {
      AdminUtils.showToast("Tour ID not found", "danger");
      return;
    }

    try {
      const result = await tourAPI.deleteImage(this.currentTourId, publicId);

      if (result.success) {
        AdminUtils.showToast("Image deleted successfully!", "success");
        const tour = await tourAPI.getById(this.currentTourId);
        if (tour.data && tour.data.images) {
          const images = tour.data.images.map((url) => {
            return typeof url === "string"
              ? { url, publicId: url.split("/").pop().split(".")[0] }
              : url;
          });
          this.displayTourImages(images);
        }
      } else {
        AdminUtils.showToast(
          result.message || "Failed to delete image",
          "danger"
        );
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      AdminUtils.showToast("Failed to delete image", "danger");
    }
  }

  // Add tour date
  addTourDate() {
    const dateInput = document.getElementById("newTourDate");
    const slotsInput = document.getElementById("newTourSlots");

    const date = dateInput.value;
    const slots = parseInt(slotsInput.value);

    if (!date) {
      AdminUtils.showToast("Please select a date", "warning");
      return;
    }
    if (!slots || slots < 1) {
      AdminUtils.showToast("Please enter valid slots", "warning");
      return;
    }

    if (this.tourAvailableDates.some((d) => d.startDate === date)) {
      AdminUtils.showToast("This date is already added", "warning");
      return;
    }

    // Calculate endDate based on tour duration
    const days = parseInt(document.getElementById("tourDays").value) || 1;
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    this.tourAvailableDates.push({
      startDate: date,
      endDate: endDate.toISOString().split("T")[0],
      availableSlots: slots,
      price: parseFloat(document.getElementById("priceAdult").value) || 0,
    });

    this.tourAvailableDates.sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );
    this.renderTourDates();
    dateInput.value = "";
  }

  // Remove tour date
  removeTourDate(index) {
    this.tourAvailableDates.splice(index, 1);
    this.renderTourDates();
  }

  // Render tour dates
  renderTourDates() {
    const tbody = document.getElementById("tourDatesList");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (this.tourAvailableDates.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center text-muted small py-3">No dates added yet</td></tr>';
      return;
    }

    this.tourAvailableDates.forEach((date, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${AdminUtils.formatDate(date.startDate)}</td>
        <td>${AdminUtils.formatDate(date.endDate)}</td>
        <td>${date.availableSlots} slots</td>
        <td class="text-end">
          <button type="button" class="btn btn-outline-danger btn-sm py-0" onclick="controller.removeTourDate(${index})">
            <i class="bi bi-x"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
}

// Initialize controller
let controller;
// Initialization moved to admin/tours/index.html to avoid redirects on public pages


// Global functions for onclick handlers
function openCreateModal() {
  controller.openCreateModal();
}

function saveTour() {
  controller.saveTour();
}

function uploadTourImages() {
  controller.uploadTourImages();
}

function addTourDate() {
  controller.addTourDate();
}

function resetFilters() {
  controller.resetFilters();
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TourAPI, TourAdminController };
}
