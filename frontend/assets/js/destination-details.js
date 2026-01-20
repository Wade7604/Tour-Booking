// Destination Details Page Controller
class DestinationDetailsController {
  constructor() {
    this.destination = null;
    this.slug = null;
  }

  // Initialize the page
  async init() {
    // Get slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.slug = urlParams.get("slug");

    if (!this.slug) {
      this.showError();
      return;
    }

    await this.loadDestination();
  }

  // Load destination data
  async loadDestination() {
    this.showLoading(true);

    try {
      const result = await DestinationAPI.getDestinationBySlug(this.slug);

      if (result.success && result.data) {
        this.destination = result.data;
        this.renderDestination();
        this.showContent();
      } else {
        this.showError();
      }
    } catch (error) {
      console.error("Error loading destination:", error);
      this.showError();
    } finally {
      this.showLoading(false);
    }
  }

  // Render destination details
  renderDestination() {
    const dest = this.destination;

    // Update page title
    document.title = `${dest.name} - TourBooking`;

    // Render hero section
    this.renderHero(dest);

    // Render gallery
    this.renderGallery(dest);

    // Render description
    this.renderDescription(dest);

    // Render quick facts
    this.renderQuickFacts(dest);

    // Render location info
    this.renderLocationInfo(dest);

    // Load related tours
    this.loadRelatedTours(dest.id);
  }

  // Render hero section
  renderHero(dest) {
    const heroImage = dest.images && dest.images.length > 0
      ? dest.images[0]
      : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80";

    document.getElementById("heroImage").src = heroImage;
    document.getElementById("heroImage").alt = dest.name;
    document.getElementById("destinationTitle").textContent = dest.name;
    document.getElementById("breadcrumbName").textContent = dest.name;

    const meta = document.getElementById("destinationMeta");
    meta.innerHTML = `
      <i class="bi bi-geo-alt-fill"></i>
      <span>${this.escapeHtml(dest.city)}, ${this.escapeHtml(dest.country)}</span>
    `;
  }

  // Render gallery
  renderGallery(dest) {
    const gallery = document.getElementById("imageGallery");
    const images = dest.images || [];

    if (images.length === 0) {
      gallery.innerHTML = `
        <p class="text-muted">No images available</p>
      `;
      return;
    }

    // Add class for single image
    if (images.length === 1) {
      gallery.classList.add("destination-gallery-single");
    }

    gallery.innerHTML = "";
    images.forEach((imageUrl, index) => {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = `${dest.name} - Image ${index + 1}`;
      img.onerror = () => {
        img.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";
      };
      gallery.appendChild(img);
    });
  }

  // Render description
  renderDescription(dest) {
    const description = document.getElementById("destinationDescription");
    description.textContent = dest.description || "No description available.";
  }

  // Render quick facts
  renderQuickFacts(dest) {
    const quickFacts = document.getElementById("quickFacts");
    
    const facts = [
      {
        icon: "bi-globe",
        label: "Country",
        value: dest.country,
      },
      {
        icon: "bi-pin-map",
        label: "City",
        value: dest.city,
      },
      {
        icon: "bi-images",
        label: "Photos",
        value: dest.images ? dest.images.length : 0,
      },
    ];

    quickFacts.innerHTML = facts
      .map(
        (fact) => `
      <div class="col-md-4 col-sm-6">
        <div class="fact-card">
          <i class="bi ${fact.icon}"></i>
          <div class="fact-label">${fact.label}</div>
          <div class="fact-value">${this.escapeHtml(String(fact.value))}</div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Render location info
  renderLocationInfo(dest) {
    const locationInfo = document.getElementById("locationInfo");

    const infoItems = [
      {
        icon: "bi-globe",
        label: "Country",
        value: dest.country,
      },
      {
        icon: "bi-pin-map-fill",
        label: "City",
        value: dest.city,
      },
      {
        icon: "bi-calendar-plus",
        label: "Added",
        value: this.formatDate(dest.createdAt),
      },
    ];

    locationInfo.innerHTML = infoItems
      .map(
        (item) => `
      <div class="destination-info-item">
        <i class="bi ${item.icon}"></i>
        <div class="info-content">
          <div class="info-label">${item.label}</div>
          <div class="info-value">${this.escapeHtml(item.value)}</div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Show loading state
  showLoading(show) {
    const loading = document.getElementById("loadingSpinner");
    if (loading) {
      loading.style.display = show ? "flex" : "none";
    }
  }

  // Show content
  showContent() {
    const content = document.getElementById("destinationContent");
    if (content) {
      content.style.display = "block";
    }
  }

  // Show error
  showError() {
    this.showLoading(false);
    const error = document.getElementById("errorMessage");
    if (error) {
      error.style.display = "block";
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Load related tours
  async loadRelatedTours(destinationId) {
    const section = document.getElementById("relatedToursSection");
    const loading = document.getElementById("relatedToursLoading");
    const grid = document.getElementById("relatedToursGrid");
    const empty = document.getElementById("relatedToursEmpty");

    if (!section || !loading || !grid || !empty) return;

    // Show section and loading
    section.style.display = "block";
    loading.style.display = "block";
    grid.style.display = "none";
    empty.style.display = "none";

    try {
      const response = await API.get(
        `/tours?destinationId=${destinationId}&status=active&limit=6`
      );
      const data = response.data || response;
      const tours = data.tours || [];

      loading.style.display = "none";

      if (tours.length === 0) {
        empty.style.display = "block";
        return;
      }

      grid.style.display = "flex";
      grid.innerHTML = tours.map((tour) => this.createTourCard(tour)).join("");
    } catch (error) {
      console.error("Error loading related tours:", error);
      loading.style.display = "none";
      empty.style.display = "block";
    }
  }

  // Create tour card HTML
  createTourCard(tour) {
    const image =
      tour.coverImage ||
      tour.images?.[0] ||
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80";

    const nextDate = this.getNextAvailableDate(tour);

    return `
      <div class="col-md-6">
        <div class="tour-card-compact" onclick="window.location.href='/tour/details/?slug=${
          tour.slug
        }'">
          <div class="tour-card-image">
            <img src="${image}" alt="${this.escapeHtml(tour.name)}" 
                 onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80'"/>
            ${
              tour.featured
                ? '<span class="tour-badge"><i class="bi bi-star-fill"></i> Featured</span>'
                : ""
            }
          </div>
          <div class="tour-card-content">
            <h5 class="tour-card-title">${this.escapeHtml(tour.name)}</h5>
            <div class="tour-card-meta">
              <span><i class="bi bi-clock"></i> ${tour.duration?.days || 0}D${
      tour.duration?.nights || 0
    }N</span>
              <span><i class="bi bi-people"></i> Max ${
                tour.maxGroupSize || 0
              }</span>
            </div>
            ${
              nextDate
                ? `
            <div class="tour-card-date">
              <i class="bi bi-calendar-check"></i>
              Next: ${this.formatDateShort(nextDate.startDate)}
            </div>
            `
                : ""
            }
            <div class="tour-card-footer">
              <div class="tour-price">
                <span class="price-label">From</span>
                <span class="price-amount">${this.formatPrice(
                  tour.price?.adult || 0
                )}</span>
              </div>
              <button class="btn btn-sm btn-primary">View Details</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Get next available date
  getNextAvailableDate(tour) {
    if (!tour.availableDates || tour.availableDates.length === 0) return null;

    const now = new Date();
    const futureDates = tour.availableDates
      .filter((d) => new Date(d.startDate) > now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return futureDates[0] || null;
  }

  // Format price in VND
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }

  // Format date short
  formatDateShort(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  const controller = new DestinationDetailsController();
  controller.init();
});
