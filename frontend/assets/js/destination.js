// Destination API Service
class DestinationAPI {
  // Get all destinations with pagination and filters
  static async getAllDestinations(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.country) params.append("country", filters.country);
      if (filters.city) params.append("city", filters.city);

      return await API.request(`/destinations?${params.toString()}`);
    } catch (error) {
      console.error("Get all destinations error:", error);
      throw error;
    }
  }

  // Search destinations
  static async searchDestinations(query, page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.country) params.append("country", filters.country);
      if (filters.city) params.append("city", filters.city);

      return await API.request(`/destinations/search?${params.toString()}`);
    } catch (error) {
      console.error("Search destinations error:", error);
      throw error;
    }
  }

  // Get destination by ID
  static async getDestinationById(id) {
    try {
      return await API.request(`/destinations/${id}`);
    } catch (error) {
      console.error("Get destination by ID error:", error);
      throw error;
    }
  }

  // Get destination by slug
  static async getDestinationBySlug(slug) {
    try {
      return await API.request(`/destinations/slug/${slug}`);
    } catch (error) {
      console.error("Get destination by slug error:", error);
      throw error;
    }
  }

  // Create new destination
  static async createDestination(destinationData) {
    try {
      return await API.request("/destinations", {
        method: "POST",
        body: JSON.stringify(destinationData),
      });
    } catch (error) {
      console.error("Create destination error:", error);
      throw error;
    }
  }

  // Update destination
  static async updateDestination(id, destinationData) {
    try {
      return await API.request(`/destinations/${id}`, {
        method: "PUT",
        body: JSON.stringify(destinationData),
      });
    } catch (error) {
      console.error("Update destination error:", error);
      throw error;
    }
  }

  // Delete destination
  static async deleteDestination(id) {
    try {
      return await API.request(`/destinations/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Delete destination error:", error);
      throw error;
    }
  }

  // Update destination status
  static async updateDestinationStatus(id, status) {
    try {
      return await API.request(`/destinations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Update destination status error:", error);
      throw error;
    }
  }

  // Get destination statistics
  static async getDestinationStatistics() {
    try {
      return await API.request("/destinations/statistics/overview");
    } catch (error) {
      console.error("Get destination statistics error:", error);
      throw error;
    }
  }

  // Add images to destination
  static async addImages(id, images) {
    try {
      return await API.request(`/destinations/${id}/images`, {
        method: "POST",
        body: JSON.stringify({ images }),
      });
    } catch (error) {
      console.error("Add images error:", error);
      throw error;
    }
  }

  // Remove images from destination
  static async removeImages(id, images) {
    try {
      return await API.request(`/destinations/${id}/images`, {
        method: "DELETE",
        body: JSON.stringify({ images }),
      });
    } catch (error) {
      console.error("Remove images error:", error);
      throw error;
    }
  }

  // Get destinations by country
  static async getDestinationsByCountry(country, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      return await API.request(
        `/destinations/country/${country}?${params.toString()}`
      );
    } catch (error) {
      console.error("Get destinations by country error:", error);
      throw error;
    }
  }

  // Reindex destination in Elasticsearch
  static async reindexDestination(id) {
    try {
      return await API.request(`/destinations/${id}/reindex`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Reindex destination error:", error);
      throw error;
    }
  }

  // Reindex all destinations
  static async reindexAllDestinations() {
    try {
      return await API.request("/destinations/elasticsearch/reindex", {
        method: "POST",
      });
    } catch (error) {
      console.error("Reindex all destinations error:", error);
      throw error;
    }
  }

  // Check Elasticsearch health
  static async checkElasticsearchHealth() {
    try {
      return await API.request("/destinations/elasticsearch/health");
    } catch (error) {
      console.error("Elasticsearch health check error:", error);
      throw error;
    }
  }
}

// Destination Admin Page Controller
class DestinationAdminController {
  constructor() {
    this.currentPage = 1;
    this.currentLimit = 20;
    this.currentFilters = {};
    this.searchTimeout = null;
    this.destinationModal = null;
    this.imageModal = null;
  }

  // Initialize the page
  async init() {
    const hasAccess = await AuthMiddleware.requirePermission("destination:view");
    if (!hasAccess) return;

    await AuthMiddleware.setupPermissionUI();

    this.destinationModal = new bootstrap.Modal(
      document.getElementById("destinationModal")
    );
    this.imageModal = new bootstrap.Modal(
      document.getElementById("imageModal")
    );

    this.setupEventListeners();
    await this.loadStatistics();
    await this.loadDestinations();
    await this.populateFilters();
  }

  // Setup event listeners
  setupEventListeners() {
    // Search with debounce
    document.getElementById("searchInput").addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1;
        this.loadDestinations();
      }, 500);
    });

    // Filters
    document.getElementById("statusFilter").addEventListener("change", () => {
      this.currentPage = 1;
      this.loadDestinations();
    });

    document.getElementById("countryFilter").addEventListener("change", () => {
      this.currentPage = 1;
      this.loadDestinations();
    });

    document.getElementById("cityFilter").addEventListener("change", () => {
      this.currentPage = 1;
      this.loadDestinations();
    });

    // Auto-generate slug from name
    document.getElementById("destinationName").addEventListener("input", (e) => {
      const slug = e.target.value
        .toLowerCase()
        .normalize('NFD') // Decompose combined graphemes
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[đĐ]/g, 'd') // Handle Vietnamese 'd'
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      document.getElementById("destinationSlug").value = slug;
    });
  }

  // Load statistics
  async loadStatistics() {
    try {
      const result = await DestinationAPI.getDestinationStatistics();
      if (result.success) {
        const stats = result.data;
        document.getElementById("totalDestinations").textContent = stats.total || 0;
        document.getElementById("activeDestinations").textContent = stats.byStatus?.active || 0;
        document.getElementById("inactiveDestinations").textContent = stats.byStatus?.inactive || 0;
        document.getElementById("totalCountries").textContent = Object.keys(stats.byCountry || {}).length;
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }

  // Load destinations
  async loadDestinations() {
    const searchQuery = document.getElementById("searchInput").value.trim();
    const statusFilter = document.getElementById("statusFilter").value;
    const countryFilter = document.getElementById("countryFilter").value;
    const cityFilter = document.getElementById("cityFilter").value;

    this.currentFilters = {};
    if (statusFilter) this.currentFilters.status = statusFilter;
    if (countryFilter) this.currentFilters.country = countryFilter;
    if (cityFilter) this.currentFilters.city = cityFilter;

    document.getElementById("loadingSpinner").style.display = "block";
    document.getElementById("destinationsTable").style.display = "none";
    document.getElementById("noResults").style.display = "none";

    try {
      let result;
      if (searchQuery) {
        result = await DestinationAPI.searchDestinations(
          searchQuery,
          this.currentPage,
          this.currentLimit,
          this.currentFilters
        );
      } else {
        result = await DestinationAPI.getAllDestinations(
          this.currentPage,
          this.currentLimit,
          this.currentFilters
        );
      }

      if (result.success) {
        this.displayDestinations(result.data, result.pagination);
      }
    } catch (error) {
      console.error("Error loading destinations:", error);
      alert("Failed to load destinations: " + error.message);
    } finally {
      document.getElementById("loadingSpinner").style.display = "none";
    }
  }

  // Display destinations
  displayDestinations(destinations, pagination) {
    const tbody = document.getElementById("destinationsTableBody");
    tbody.innerHTML = "";

    if (!destinations || destinations.length === 0) {
      document.getElementById("noResults").style.display = "block";
      document.getElementById("resultCount").textContent = "0 results";
      return;
    }

    document.getElementById("destinationsTable").style.display = "block";
    document.getElementById("resultCount").textContent =
      `${pagination.total} result${pagination.total !== 1 ? "s" : ""}`;

    destinations.forEach((dest) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <strong>${this.escapeHtml(dest.name)}</strong><br>
          <small class="text-muted">${this.escapeHtml(dest.slug)}</small>
        </td>
        <td>${this.escapeHtml(dest.country)}</td>
        <td>${this.escapeHtml(dest.city)}</td>
        <td>
          <span class="badge bg-info">
            <i class="bi bi-images"></i> ${dest.images?.length || 0}
          </span>
        </td>
        <td>
          <span class="badge bg-${dest.status === "active" ? "success" : "secondary"}">
            ${dest.status}
          </span>
        </td>
        <td>${this.formatDate(dest.createdAt)}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button
              class="btn btn-outline-primary"
              onclick="controller.openEditModal('${dest.id}')"
              data-permission="destination:update"
              title="Edit"
            >
              <i class="bi bi-pencil"></i>
            </button>
            <button
              class="btn btn-outline-info"
              onclick="controller.openImageModal('${dest.id}')"
              data-permission="destination:update"
              title="Manage Images"
            >
              <i class="bi bi-images"></i>
            </button>
            <button
              class="btn btn-outline-warning"
              onclick="controller.toggleStatus('${dest.id}', '${dest.status}')"
              data-permission="destination:update"
              title="Toggle Status"
            >
              <i class="bi bi-toggle-${dest.status === "active" ? "on" : "off"}"></i>
            </button>
            <button
              class="btn btn-outline-danger"
              onclick="controller.deleteDestination('${dest.id}')"
              data-permission="destination:delete"
              title="Delete"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Update pagination info
    document.getElementById("showingFrom").textContent = (pagination.page - 1) * pagination.limit + 1;
    document.getElementById("showingTo").textContent = Math.min(
      pagination.page * pagination.limit,
      pagination.total
    );
    document.getElementById("totalResults").textContent = pagination.total;

    this.renderPagination(pagination);
    AuthMiddleware.setupPermissionUI();
  }

  // Render pagination
  renderPagination(pagination) {
    const paginationEl = document.getElementById("pagination");
    paginationEl.innerHTML = "";

    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="controller.changePage(${currentPage - 1}); return false;">Previous</a>`;
    paginationEl.appendChild(prevLi);

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#" onclick="controller.changePage(${i}); return false;">${i}</a>`;
      paginationEl.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="controller.changePage(${currentPage + 1}); return false;">Next</a>`;
    paginationEl.appendChild(nextLi);
  }

  // Change page
  changePage(page) {
    this.currentPage = page;
    this.loadDestinations();
  }

  // Populate filter dropdowns
  async populateFilters() {
    try {
      const result = await DestinationAPI.getAllDestinations(1, 1000);
      if (result.success) {
        const destinations = result.data;

        // Get unique countries and cities
        const countries = [...new Set(destinations.map((d) => d.country))].sort();
        const cities = [...new Set(destinations.map((d) => d.city))].sort();

        const countrySelect = document.getElementById("countryFilter");
        countries.forEach((country) => {
          const option = document.createElement("option");
          option.value = country;
          option.textContent = country;
          countrySelect.appendChild(option);
        });

        const citySelect = document.getElementById("cityFilter");
        cities.forEach((city) => {
          const option = document.createElement("option");
          option.value = city;
          option.textContent = city;
          citySelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error populating filters:", error);
    }
  }

  // Open create modal
  openCreateModal() {
    document.getElementById("modalTitle").textContent = "Add Destination";
    document.getElementById("destinationForm").reset();
    document.getElementById("destinationId").value = "";
    
    // Show image upload section for create mode
    const imageSection = document.getElementById("destinationImages").closest('.col-12');
    if (imageSection) {
      imageSection.style.display = 'block';
    }
    
    // Clear preview
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
      previewContainer.innerHTML = '';
      previewContainer.style.display = 'none';
    }
    
    this.destinationModal.show();
  }

  // Open edit modal
  async openEditModal(id) {
    try {
      const result = await DestinationAPI.getDestinationById(id);
      if (result.success) {
        const dest = result.data;
        document.getElementById("modalTitle").textContent = "Edit Destination";
        document.getElementById("destinationId").value = dest.id;
        document.getElementById("destinationName").value = dest.name;
        document.getElementById("destinationSlug").value = dest.slug;
        document.getElementById("destinationCountry").value = dest.country;
        document.getElementById("destinationCity").value = dest.city;
        document.getElementById("destinationDescription").value = dest.description;
        document.getElementById("destinationStatus").value = dest.status;
        
        // Hide image upload section for edit mode (use Image Management Modal instead)
        const imageSection = document.getElementById("destinationImages").closest('.col-12');
        if (imageSection) {
          imageSection.style.display = 'none';
        }
        
        this.destinationModal.show();
      }
    } catch (error) {
      alert("Failed to load destination: " + error.message);
    }
  }

  // Save destination
  async saveDestination() {
    const id = document.getElementById("destinationId").value;
    const data = {
      name: document.getElementById("destinationName").value,
      slug: document.getElementById("destinationSlug").value,
      country: document.getElementById("destinationCountry").value,
      city: document.getElementById("destinationCity").value,
      description: document.getElementById("destinationDescription").value,
      status: document.getElementById("destinationStatus").value,
    };

    try {
      let result;
      if (id) {
        // UPDATE mode - images are NOT updated here, use Image Management Modal
        result = await DestinationAPI.updateDestination(id, data);
      } else {
        // CREATE mode - create destination first, then upload images if any
        result = await DestinationAPI.createDestination(data);
        
        // If creation successful and images are selected, upload them
        if (result.success) {
          const imageFiles = document.getElementById("destinationImages").files;
          if (imageFiles && imageFiles.length > 0) {
            try {
              await API.uploadDestinationImages(result.data.id, imageFiles);
            } catch (uploadError) {
              console.error("Failed to upload images:", uploadError);
              alert("Destination created but failed to upload images. You can upload them later.");
            }
          }
        }
      }

      if (result.success) {
        this.destinationModal.hide();
        await this.loadDestinations();
        await this.loadStatistics();
        alert(id ? "Destination updated successfully!" : "Destination created successfully!");
      }
    } catch (error) {
      alert("Failed to save destination: " + error.message);
    }
  }

  // Delete destination
  async deleteDestination(id) {
    if (!confirm("Are you sure you want to delete this destination?")) {
      return;
    }

    try {
      const result = await DestinationAPI.deleteDestination(id);
      if (result.success) {
        await this.loadDestinations();
        await this.loadStatistics();
        alert("Destination deleted successfully!");
      }
    } catch (error) {
      alert("Failed to delete destination: " + error.message);
    }
  }

  // Toggle status
  async toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const result = await DestinationAPI.updateDestinationStatus(id, newStatus);
      if (result.success) {
        await this.loadDestinations();
        await this.loadStatistics();
      }
    } catch (error) {
      alert("Failed to update status: " + error.message);
    }
  }

  // Open image modal
  async openImageModal(id) {
    document.getElementById("imageDestinationId").value = id;

    try {
      const result = await DestinationAPI.getDestinationById(id);
      if (result.success) {
        const dest = result.data;
        this.displayCurrentImages(dest.images || []);
        this.imageModal.show();
      }
    } catch (error) {
      alert("Failed to load images: " + error.message);
    }
  }

  // Display current images
  displayCurrentImages(images) {
    const container = document.getElementById("currentImages");
    container.innerHTML = "";

    if (!images || images.length === 0) {
      container.innerHTML = '<p class="text-muted">No images uploaded yet</p>';
      return;
    }

    images.forEach((imageUrl, index) => {
      const col = document.createElement("div");
      col.className = "col-md-4";
      col.innerHTML = `
        <div class="card">
          <img src="${imageUrl}" class="card-img-top" style="height: 150px; object-fit: cover;" alt="Image ${index + 1}">
          <div class="card-body p-2 text-center">
            <button class="btn btn-sm btn-danger" onclick="controller.removeImage('${imageUrl}')">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  }

  // Upload images
  async uploadImages() {
    const id = document.getElementById("imageDestinationId").value;
    const files = document.getElementById("uploadImages").files;

    if (!files || files.length === 0) {
      alert("Please select images to upload");
      return;
    }

    try {
      const result = await API.uploadDestinationImages(id, files);
      if (result.success) {
        document.getElementById("uploadImages").value = "";
        const destResult = await DestinationAPI.getDestinationById(id);
        if (destResult.success) {
          this.displayCurrentImages(destResult.data.images || []);
        }
        await this.loadDestinations();
        alert("Images uploaded successfully!");
      }
    } catch (error) {
      alert("Failed to upload images: " + error.message);
    }
  }

  // Remove image
  async removeImage(imageUrl) {
    const id = document.getElementById("imageDestinationId").value;

    if (!confirm("Are you sure you want to remove this image?")) {
      return;
    }

    try {
      const urlParts = imageUrl.split("/");
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const fileName = fileNameWithExt.split(".")[0];
      
      const uploadIndex = urlParts.indexOf("upload");
      const publicIdParts = urlParts.slice(uploadIndex + 2);
      publicIdParts[publicIdParts.length - 1] = fileName;
      const publicId = publicIdParts.join("/");

      const result = await API.deleteDestinationImage(id, publicId);
      if (result.success) {
        const destResult = await DestinationAPI.getDestinationById(id);
        if (destResult.success) {
          this.displayCurrentImages(destResult.data.images || []);
        }
        await this.loadDestinations();
        alert("Image removed successfully!");
      }
    } catch (error) {
      alert("Failed to remove image: " + error.message);
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

// Initialize controller
let controller;

document.addEventListener("DOMContentLoaded", () => {
  controller = new DestinationAdminController();
  controller.init();
});

// Global functions for onclick handlers
function openCreateModal() {
  controller.openCreateModal();
}

function saveDestination() {
  controller.saveDestination();
}

function uploadImages() {
  controller.uploadImages();
}

// Preview selected images
function previewImages(input) {
  const previewContainer = document.getElementById('imagePreviewContainer');
  previewContainer.innerHTML = '';
  
  if (!input.files || input.files.length === 0) {
    previewContainer.style.display = 'none';
    return;
  }
  
  previewContainer.style.display = 'flex';
  
  Array.from(input.files).forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const col = document.createElement('div');
      col.className = 'col-4 col-md-3';
      col.innerHTML = `
        <div class="position-relative">
          <img 
            src="${e.target.result}" 
            class="img-fluid rounded" 
            style="height: 100px; width: 100%; object-fit: cover; border: 2px solid #e2e8f0;"
            alt="Preview ${index + 1}"
          />
          <div class="position-absolute top-0 start-0 m-1">
            <span class="badge bg-dark bg-opacity-75">
              ${index + 1}
            </span>
          </div>
        </div>
      `;
      previewContainer.appendChild(col);
    };
    
    reader.readAsDataURL(file);
  });
}

// Preview upload images in image management modal
function previewUploadImages(input) {
  const previewContainer = document.getElementById('uploadPreviewContainer');
  previewContainer.innerHTML = '';
  
  if (!input.files || input.files.length === 0) {
    previewContainer.style.display = 'none';
    return;
  }
  
  previewContainer.style.display = 'flex';
  
  Array.from(input.files).forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const col = document.createElement('div');
      col.className = 'col-4 col-md-3';
      col.innerHTML = `
        <div class="position-relative">
          <img 
            src="${e.target.result}" 
            class="img-fluid rounded" 
            style="height: 100px; width: 100%; object-fit: cover; border: 2px solid #e2e8f0;"
            alt="Upload Preview ${index + 1}"
          />
          <div class="position-absolute top-0 start-0 m-1">
            <span class="badge bg-primary bg-opacity-75">
              ${index + 1}
            </span>
          </div>
        </div>
      `;
      previewContainer.appendChild(col);
    };
    
    reader.readAsDataURL(file);
  });
}


// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DestinationAPI, DestinationAdminController };
}