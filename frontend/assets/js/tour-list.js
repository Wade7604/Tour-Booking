/**
 * Tour List Controller
 * Handles searching, filtering, and displaying tours
 */
class TourListController {
  constructor() {
    this.currentPage = 1;
    this.limit = 9;
    this.currentFilters = {
      q: "",
      tourType: [],
      difficulty: [],
      minPrice: 0,
      maxPrice: 50000000,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    
    this.debounceTimer = null;
  }

  // Initialize the controller
  init() {
    this.setupEventListeners();
    this.handleUrlParams();
    this.loadTours();
  }

  // Handle parameters from URL (e.g., search from homepage)
  handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('q');
    if (search) {
      document.getElementById('searchInput').value = search;
      this.currentFilters.q = search;
    }
    
    const type = urlParams.get('type');
    if (type) {
      const checkbox = document.querySelector(`.tour-type-filter[value="${type}"]`);
      if (checkbox) checkbox.checked = true;
      this.currentFilters.tourType = [type];
    }
  }

  // Setup UI event listeners
  setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.currentFilters.q = e.target.value.trim();
        this.resetToFirstPage();
      }, 500);
    });

    // Tour Type Filters
    document.querySelectorAll('.tour-type-filter').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.currentFilters.tourType = Array.from(document.querySelectorAll('.tour-type-filter:checked'))
          .map(cb => cb.value);
        this.resetToFirstPage();
      });
    });

    // Difficulty Filters
    document.querySelectorAll('.difficulty-filter').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.currentFilters.difficulty = Array.from(document.querySelectorAll('.difficulty-filter:checked'))
          .map(cb => cb.value);
        this.resetToFirstPage();
      });
    });

    // Price Range Filter
    const priceRange = document.getElementById('priceRange');
    const priceLabel = document.getElementById('priceLabel');
    priceRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      priceLabel.textContent = new Intl.NumberFormat('vi-VN').format(val);
      this.currentFilters.maxPrice = val;
      
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.resetToFirstPage();
      }, 500);
    });

    // Sort By Change
    document.getElementById('sortBySelect').addEventListener('change', (e) => {
      const [field, order] = e.target.value.split(':');
      this.currentFilters.sortBy = field;
      this.currentFilters.sortOrder = order;
      this.resetToFirstPage();
    });
  }

  // Reset to page 1 and reload
  resetToFirstPage() {
    this.currentPage = 1;
    this.loadTours();
  }

  // Helper: Format price as VND
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }

  // Clear all current filters
  clearFilters() {
    document.getElementById('searchInput').value = "";
    document.querySelectorAll('.tour-type-filter, .difficulty-filter').forEach(cb => cb.checked = false);
    document.getElementById('priceRange').value = 50000000;
    document.getElementById('priceLabel').textContent = "50.000.000";
    document.getElementById('sortBySelect').value = "createdAt:desc";
    
    this.currentFilters = {
      q: "",
      tourType: [],
      difficulty: [],
      minPrice: 0,
      maxPrice: 50000000,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    
    this.resetToFirstPage();
  }

  // Load tours from API
  async loadTours() {
    const grid = document.getElementById('toursGrid');
    const loading = document.getElementById('toursLoading');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');

    loading.style.display = 'flex';
    grid.style.display = 'none';
    noResults.style.display = 'none';
    pagination.style.display = 'none';

    try {
      // Build request parameters
      const params = {
        page: this.currentPage,
        limit: this.limit,
        status: 'active',
        sortBy: this.currentFilters.sortBy,
        sortOrder: this.currentFilters.sortOrder,
        minPrice: this.currentFilters.minPrice,
        maxPrice: this.currentFilters.maxPrice
      };

      // Add difficulty filter if selected
      if (this.currentFilters.difficulty.length > 0) {
        params.difficulty = this.currentFilters.difficulty.join(',');
      }

      // Add tour type filter if selected
      if (this.currentFilters.tourType.length > 0) {
        params.tourType = this.currentFilters.tourType.join(',');
      }

      let response;
      if (this.currentFilters.q) {
        response = await tourAPI.search(this.currentFilters.q, params);
      } else {
        response = await tourAPI.getAll(params);
      }

      const result = response.data || response;
      const tours = result.tours || [];
      const pagin = result.pagination || { total: 0, totalPages: 0 };

      document.getElementById('resultsCount').textContent = pagin.total || 0;

      if (tours.length === 0) {
        noResults.style.display = 'block';
        loading.style.display = 'none';
        return;
      }

      this.renderTours(tours);
      this.renderPagination(pagin);

      loading.style.display = 'none';
      grid.style.display = 'grid';
      pagination.style.display = 'flex';

    } catch (error) {
      console.error("Error loading tours:", error);
      loading.innerHTML = '<p class="text-danger">Failed to load tours. Please try again later.</p>';
    }
  }

  // Render tour cards into the grid
  renderTours(tours) {
    const grid = document.getElementById('toursGrid');
    grid.innerHTML = tours.map(tour => {
      const coverImg = tour.coverImage || tour.images?.[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80';
      const duration = tour.duration ? `${tour.duration.days}D${tour.duration.nights}N` : 'N/A';
      
      // Get next available date
      let nextDateStr = "No upcoming dates";
      if (tour.availableDates && tour.availableDates.length > 0) {
        const now = new Date();
        const futureDates = tour.availableDates
          .filter(d => new Date(d.startDate) > now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        if (futureDates.length > 0) {
          nextDateStr = `Starts: ${new Date(futureDates[0].startDate).toLocaleDateString()}`;
        }
      }

      return `
        <div class="tour-card" onclick="window.location.href='/tour/details/?slug=${tour.slug}'">
          <div class="card-image-wrapper">
            <img src="${coverImg}" alt="${tour.name}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80'">
            ${tour.featured ? '<span class="card-badge"><i class="bi bi-star-fill"></i> Featured</span>' : ''}
          </div>
          <div class="card-body">
            <div class="card-info">
              <span class="info-item"><i class="bi bi-clock"></i> ${duration}</span>
              <span class="info-item"><i class="bi bi-people"></i> ${tour.maxGroupSize || 0}</span>
              <span class="info-item"><i class="bi bi-bar-chart-steps"></i> ${tour.difficulty || 'Easy'}</span>
            </div>
            <h5 class="card-title">${tour.name}</h5>
            <div class="card-location">
              <i class="bi bi-geo-alt"></i>
              <span>${tour.destination?.name || tour.destinations?.[0]?.name || 'Vietnam'}</span>
            </div>
            <div class="card-date">
              <i class="bi bi-calendar-check"></i>
              <span>${nextDateStr}</span>
            </div>
            <div class="card-price-section">
              <div>
                <div class="card-price-label">Price from</div>
                <div class="card-price">${this.formatPrice(tour.price?.adult || 0)}</div>
                <div class="card-price-per">per person</div>
              </div>
              <button class="card-book-btn">Explore</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render pagination controls
  renderPagination(pagination) {
    const list = document.getElementById('paginationList');
    list.innerHTML = "";
    
    if (pagination.totalPages <= 1) return;

    // Previous Button
    list.innerHTML += `
      <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="listController.changePage(${this.currentPage - 1}); return false;">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;

    // Page Numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
      list.innerHTML += `
        <li class="page-item ${this.currentPage === i ? 'active' : ''}">
          <a class="page-link" href="#" onclick="listController.changePage(${i}); return false;">${i}</a>
        </li>
      `;
    }

    // Next Button
    list.innerHTML += `
      <li class="page-item ${this.currentPage === pagination.totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="listController.changePage(${this.currentPage + 1}); return false;">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;
  }

  // Change page handler
  changePage(page) {
    this.currentPage = page;
    this.loadTours();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Global instance
const listController = new TourListController();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  listController.init();
});

// Global functions for inline Event Handlers
function performSearch() {
  listController.resetToFirstPage();
}

function clearFilters() {
  listController.clearFilters();
}
