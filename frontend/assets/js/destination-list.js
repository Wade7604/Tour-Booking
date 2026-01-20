// Destination List Page Controller
class DestinationListController {
  constructor() {
    this.currentPage = 1;
    this.currentLimit = 20;
    this.currentFilters = {};
    this.searchTimeout = null;
    this.searchQuery = "";
    this.sortBy = "createdAt:desc";
  }

  // Initialize the page
  async init() {
    this.setupEventListeners();
    await this.loadDestinations();
    await this.populateFilters();
  }

  // Setup event listeners
  setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.currentPage = 1;
          this.loadDestinations();
        }, 500);
      });

      // Enter key to search
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          clearTimeout(this.searchTimeout);
          this.searchQuery = e.target.value.trim();
          this.currentPage = 1;
          this.loadDestinations();
        }
      });
    }

    // Filters
    const countryFilter = document.getElementById("countryFilter");
    if (countryFilter) {
      countryFilter.addEventListener("change", () => {
        this.currentPage = 1;
        this.loadDestinations();
      });
    }

    const cityFilter = document.getElementById("cityFilter");
    if (cityFilter) {
      cityFilter.addEventListener("change", () => {
        this.currentPage = 1;
        this.loadDestinations();
      });
    }

    // Sort
    const sortBySelect = document.getElementById("sortBySelect");
    if (sortBySelect) {
      sortBySelect.addEventListener("change", (e) => {
        this.sortBy = e.target.value;
        this.currentPage = 1;
        this.loadDestinations();
      });
    }
  }

  // Load destinations
  async loadDestinations() {
    const countryFilter = document.getElementById("countryFilter")?.value || "";
    const cityFilter = document.getElementById("cityFilter")?.value || "";

    this.currentFilters = {
      status: "active", // Only show active destinations to public
    };
    if (countryFilter) this.currentFilters.country = countryFilter;
    if (cityFilter) this.currentFilters.city = cityFilter;

    this.showLoading(true);

    try {
      let result;
      if (this.searchQuery) {
        result = await DestinationAPI.searchDestinations(
          this.searchQuery,
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
      this.showError();
    } finally {
      this.showLoading(false);
    }
  }

  // Display destinations
  displayDestinations(destinations, pagination) {
    const grid = document.getElementById("destinationsGrid");
    const noResults = document.getElementById("noResults");

    if (!destinations || destinations.length === 0) {
      grid.style.display = "none";
      noResults.style.display = "block";
      document.getElementById("resultsCount").textContent = "0";
      document.getElementById("pagination").style.display = "none";
      return;
    }

    grid.style.display = "grid";
    noResults.style.display = "none";
    grid.innerHTML = "";

    // Apply sorting (client-side for now)
    const sortedDestinations = this.sortDestinations(destinations);

    sortedDestinations.forEach((dest) => {
      const card = this.createDestinationCard(dest);
      grid.appendChild(card);
    });

    document.getElementById("resultsCount").textContent = pagination.total;
    this.renderPagination(pagination);
  }

  // Sort destinations
  sortDestinations(destinations) {
    const [field, order] = this.sortBy.split(":");
    
    return [...destinations].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (field === "name") {
        aVal = (aVal || "").toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // Create destination card
  createDestinationCard(dest) {
    const card = document.createElement("div");
    card.className = "destination-card";
    card.onclick = () => {
      window.location.href = `/destination/details/?slug=${dest.slug}`;
    };

    const image = dest.images && dest.images.length > 0
      ? dest.images[0]
      : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";

    const description = dest.description || "";
    const truncatedDesc = description.length > 120
      ? description.substring(0, 120) + "..."
      : description;

    card.innerHTML = `
      <img
        src="${this.escapeHtml(image)}"
        alt="${this.escapeHtml(dest.name)}"
        class="destination-card-image"
        onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'"
      />
      <div class="destination-card-body">
        <h3 class="destination-card-title">${this.escapeHtml(dest.name)}</h3>
        <div class="destination-card-location">
          <i class="bi bi-geo-alt-fill"></i>
          ${this.escapeHtml(dest.city)}, ${this.escapeHtml(dest.country)}
        </div>
        <p class="destination-card-description">
          ${this.escapeHtml(truncatedDesc)}
        </p>
      </div>
    `;

    return card;
  }

  // Render pagination
  renderPagination(pagination) {
    const paginationEl = document.getElementById("pagination");
    const paginationList = document.getElementById("paginationList");

    if (!paginationList) return;

    paginationList.innerHTML = "";

    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 1) {
      paginationEl.style.display = "none";
      return;
    }

    paginationEl.style.display = "flex";

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="listController.changePage(${currentPage - 1}); return false;">Previous</a>`;
    paginationList.appendChild(prevLi);

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#" onclick="listController.changePage(${i}); return false;">${i}</a>`;
      paginationList.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="listController.changePage(${currentPage + 1}); return false;">Next</a>`;
    paginationList.appendChild(nextLi);
  }

  // Change page
  changePage(page) {
    if (page < 1) return;
    this.currentPage = page;
    this.loadDestinations();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Populate filter dropdowns
  async populateFilters() {
    try {
      const result = await DestinationAPI.getAllDestinations(1, 1000, {
        status: "active",
      });
      if (result.success) {
        const destinations = result.data;

        // Get unique countries and cities
        const countries = [...new Set(destinations.map((d) => d.country))].sort();
        const cities = [...new Set(destinations.map((d) => d.city))].sort();

        const countrySelect = document.getElementById("countryFilter");
        if (countrySelect) {
          countries.forEach((country) => {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
          });
        }

        const citySelect = document.getElementById("cityFilter");
        if (citySelect) {
          cities.forEach((city) => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error("Error populating filters:", error);
    }
  }

  // Show loading state
  showLoading(show) {
    const loading = document.getElementById("destinationsLoading");
    const grid = document.getElementById("destinationsGrid");

    if (loading) {
      loading.style.display = show ? "flex" : "none";
    }
    if (grid && show) {
      grid.style.display = "none";
    }
  }

  // Show error
  showError() {
    const grid = document.getElementById("destinationsGrid");
    const noResults = document.getElementById("noResults");

    if (grid) grid.style.display = "none";
    if (noResults) noResults.style.display = "block";
  }

  // Utility function
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global functions
let listController;

function performSearch() {
  if (listController) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      listController.searchQuery = searchInput.value.trim();
      listController.currentPage = 1;
      listController.loadDestinations();
    }
  }
}

function clearFilters() {
  const searchInput = document.getElementById("searchInput");
  const countryFilter = document.getElementById("countryFilter");
  const cityFilter = document.getElementById("cityFilter");
  const sortBySelect = document.getElementById("sortBySelect");

  if (searchInput) searchInput.value = "";
  if (countryFilter) countryFilter.value = "";
  if (cityFilter) cityFilter.value = "";
  if (sortBySelect) sortBySelect.value = "createdAt:desc";

  if (listController) {
    listController.searchQuery = "";
    listController.currentPage = 1;
    listController.sortBy = "createdAt:desc";
    listController.loadDestinations();
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  listController = new DestinationListController();
  listController.init();
});
