// ========================================
// TOUR DETAILS PAGE
// ========================================

let currentTour = null;
let selectedDate = null;

// ========================================
// GET TOUR SLUG FROM URL
// ========================================
function getTourSlugFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("slug");
}

// ========================================
// LOAD TOUR DETAILS
// ========================================
async function loadTourDetails() {
  const tourSlug = getTourSlugFromURL();

  if (!tourSlug) {
    showError();
    return;
  }

  try {
    const response = await API.get(`/tours/slug/${tourSlug}`);

    if (!response.success || !response.data) {
      showError();
      return;
    }

    currentTour = response.data;
    renderTourDetails(currentTour);
    hideLoading();
  } catch (error) {
    console.error("Error loading tour:", error);
    showError();
  }
}

// ========================================
// RENDER TOUR DETAILS
// ========================================
function renderTourDetails(tour) {
  // Hero Section
  renderHeroSection(tour);

  // Quick Info Cards
  renderQuickInfoCards(tour);

  // Image Gallery
  renderImageGallery(tour);

  // Description
  renderDescription(tour);

  // Itinerary
  renderItinerary(tour);

  // Includes & Excludes
  renderIncludesExcludes(tour);

  // Requirements
  renderRequirements(tour);

  // Booking Sidebar
  renderBookingSidebar(tour);

  // Show content
  document.getElementById("tourContent").style.display = "block";
}

// ========================================
// RENDER HERO SECTION
// ========================================
function renderHeroSection(tour) {
  // Hero Image
  const heroImage = document.getElementById("heroImage");
  heroImage.src = tour.coverImage || tour.images?.[0] || "";
  heroImage.alt = tour.name;

  // Badge
  const badge = document.getElementById("tourBadge");
  if (tour.featured) {
    badge.innerHTML = '<i class="bi bi-star-fill"></i> Featured Tour';
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }

  // Title
  document.getElementById("tourTitle").textContent = tour.name;

  // Meta Info
  const meta = document.getElementById("tourMeta");
  const destination =
    tour.destination?.name || tour.destinations?.[0]?.name || "Vietnam";

  meta.innerHTML = `
    <div class="tour-hero-meta-item">
      <i class="bi bi-geo-alt-fill"></i>
      <span>${destination}</span>
    </div>
    <div class="tour-hero-meta-item">
      <i class="bi bi-clock-fill"></i>
      <span>${tour.duration?.days || 0}D${tour.duration?.nights || 0}N</span>
    </div>
    <div class="tour-hero-meta-item">
      <i class="bi bi-people-fill"></i>
      <span>Max ${tour.maxGroupSize || 0} people</span>
    </div>
  `;
}

// ========================================
// RENDER QUICK INFO CARDS
// ========================================
function renderQuickInfoCards(tour) {
  const container = document.getElementById("quickInfoCards");

  const cards = [
    {
      icon: "bi-clock",
      label: "Duration",
      value: `${tour.duration?.days || 0}D${tour.duration?.nights || 0}N`,
    },
    {
      icon: "bi-speedometer2",
      label: "Difficulty",
      value:
        tour.difficulty?.charAt(0).toUpperCase() + tour.difficulty?.slice(1) ||
        "N/A",
    },
    {
      icon: "bi-people",
      label: "Group Size",
      value: `Max ${tour.maxGroupSize || 0}`,
    },
    {
      icon: "bi-tag",
      label: "Tour Type",
      value:
        tour.tourType?.charAt(0).toUpperCase() + tour.tourType?.slice(1) ||
        "N/A",
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
    <div class="col-md-3 col-sm-6">
      <div class="quick-info-card">
        <div class="quick-info-icon">
          <i class="bi ${card.icon}"></i>
        </div>
        <div class="quick-info-label">${card.label}</div>
        <div class="quick-info-value">${card.value}</div>
      </div>
    </div>
  `
    )
    .join("");
}

// ========================================
// RENDER IMAGE GALLERY
// ========================================
function renderImageGallery(tour) {
  const gallery = document.getElementById("imageGallery");
  const images = tour.images || [];

  if (images.length === 0) {
    gallery.innerHTML = '<p class="text-muted">No images available</p>';
    return;
  }

  gallery.innerHTML = images
    .map(
      (img) => `
    <div class="tour-gallery-item">
      <img src="${img}" alt="${tour.name}" loading="lazy" />
    </div>
  `
    )
    .join("");
}

// ========================================
// RENDER DESCRIPTION
// ========================================
function renderDescription(tour) {
  document.getElementById("tourDescription").textContent =
    tour.description || "No description available.";
}

// ========================================
// RENDER ITINERARY
// ========================================
function renderItinerary(tour) {
  const container = document.getElementById("tourItinerary");
  const itinerary = tour.itinerary || [];

  if (itinerary.length === 0) {
    container.innerHTML = '<p class="text-muted">No itinerary available</p>';
    return;
  }

  container.innerHTML = itinerary
    .map(
      (day) => `
    <div class="itinerary-day">
      <div class="itinerary-day-marker">D${day.day}</div>
      <h4 class="itinerary-day-title">${day.title || ""}</h4>
      <ul class="itinerary-activities">
        ${(day.activities || [])
          .map((activity) => `<li>${activity}</li>`)
          .join("")}
      </ul>
    </div>
  `
    )
    .join("");
}

// ========================================
// RENDER INCLUDES & EXCLUDES
// ========================================
function renderIncludesExcludes(tour) {
  const includesContainer = document.getElementById("tourIncludes");
  const excludesContainer = document.getElementById("tourExcludes");

  const includes = tour.includes || [];
  const excludes = tour.excludes || [];

  includesContainer.innerHTML =
    includes.length > 0
      ? includes.map((item) => `<li>${item}</li>`).join("")
      : '<li class="text-muted">No information available</li>';

  excludesContainer.innerHTML =
    excludes.length > 0
      ? excludes.map((item) => `<li>${item}</li>`).join("")
      : '<li class="text-muted">No information available</li>';
}

// ========================================
// RENDER REQUIREMENTS
// ========================================
function renderRequirements(tour) {
  const container = document.getElementById("tourRequirements");
  const requirements = tour.requirements || [];

  container.innerHTML =
    requirements.length > 0
      ? requirements.map((item) => `<li>${item}</li>`).join("")
      : '<li class="text-muted">No specific requirements</li>';
}

// ========================================
// RENDER BOOKING SIDEBAR
// ========================================
function renderBookingSidebar(tour) {
  // Price - Show adult price as main price
  const priceAmount = document.getElementById("priceAmount");
  priceAmount.textContent = formatPrice(tour.price?.adult || 0);

  // Available Dates
  renderAvailableDates(tour);

  // Booking Info
  renderBookingInfo(tour);

  // Book Now Button
  const bookBtn = document.getElementById("bookNowBtn");
  bookBtn.onclick = handleBookNow;
}

// ========================================
// RENDER AVAILABLE DATES
// ========================================
function renderAvailableDates(tour) {
  const container = document.getElementById("availableDates");
  const dates = tour.availableDates || [];

  // Filter future dates
  const now = new Date();
  const futureDates = dates
    .filter((d) => new Date(d.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (futureDates.length === 0) {
    container.innerHTML =
      '<p class="text-muted text-center">No available dates</p>';
    return;
  }

  container.innerHTML = futureDates
    .map(
      (date, index) => `
    <div class="date-item" onclick="selectDate(${index})">
      <div class="date-item-date">
        ${formatDateRange(date.startDate, date.endDate)}
      </div>
      <div class="date-item-info">
        <span><i class="bi bi-people"></i> ${date.availableSlots} slots</span>
        <span>${formatPrice(date.price || tour.price?.adult || 0)}</span>
      </div>
    </div>
  `
    )
    .join("");

  // Auto-select first date
  if (futureDates.length > 0) {
    selectedDate = futureDates[0];
  }
}

// ========================================
// SELECT DATE
// ========================================
function selectDate(index) {
  const dates = document.querySelectorAll(".date-item");
  dates.forEach((d, i) => {
    if (i === index) {
      d.classList.add("selected");
    } else {
      d.classList.remove("selected");
    }
  });

  // Update selected date
  const now = new Date();
  const futureDates = (currentTour.availableDates || [])
    .filter((d) => new Date(d.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  selectedDate = futureDates[index];

  // Update price if date has custom price
  if (selectedDate.price) {
    document.getElementById("priceAmount").textContent = formatPrice(
      selectedDate.price
    );
  }
}

// ========================================
// RENDER BOOKING INFO
// ========================================
function renderBookingInfo(tour) {
  const container = document.getElementById("bookingInfo");

  const info = [
    {
      label: "Adult Price",
      value: formatPrice(tour.price?.adult || 0),
    },
    {
      label: "Child Price",
      value: formatPrice(tour.price?.child || 0),
    },
    {
      label: "Duration",
      value: `${tour.duration?.days || 0}D${tour.duration?.nights || 0}N`,
    },
    {
      label: "Group Size",
      value: `${tour.minGroupSize || 1}-${tour.maxGroupSize || 0} people`,
    },
    {
      label: "Difficulty",
      value:
        tour.difficulty?.charAt(0).toUpperCase() + tour.difficulty?.slice(1) ||
        "N/A",
    },
    {
      label: "Tour Type",
      value:
        tour.tourType?.charAt(0).toUpperCase() + tour.tourType?.slice(1) ||
        "N/A",
    },
  ];

  container.innerHTML = info
    .map(
      (item) => `
    <div class="booking-info-item">
      <span class="booking-info-label">${item.label}</span>
      <span class="booking-info-value">${item.value}</span>
    </div>
  `
    )
    .join("");
}

// ========================================
// HANDLE BOOK NOW
// ========================================
function handleBookNow() {
  if (!currentTour) {
    alert("Tour information not loaded");
    return;
  }

  // Use tour ID if available, otherwise use slug
  const tourIdentifier = currentTour.id || currentTour._id || currentTour.slug;
  
  if (!tourIdentifier) {
    alert("Cannot identify tour");
    console.error("Tour object:", currentTour);
    return;
  }

  // Redirect to booking page with tour ID (with trailing slash to prevent redirect)
  window.location.href = `/booking/?tourId=${tourIdentifier}`;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = { month: "short", day: "numeric", year: "numeric" };

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-US", options);
  }

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("en-US", options)}`;
}

function showError() {
  document.getElementById("loadingSpinner").style.display = "none";
  document.getElementById("errorMessage").style.display = "block";
}

function hideLoading() {
  document.getElementById("loadingSpinner").style.display = "none";
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

// ========================================
// INITIALIZE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadTourDetails();
});
