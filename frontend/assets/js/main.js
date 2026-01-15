// ========================================
// AUTHENTICATION
// ========================================
async function checkAuth() {
  try {
    const user = await AuthMiddleware.getCurrentUser();
    const authBtn = document.getElementById("authBtn");
    const profileDropdown = document.getElementById("profileDropdown");

    if (user) {
      authBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sign Out';
      authBtn.onclick = () => {
        if (confirm("Bạn có chắc muốn đăng xuất?")) {
          AuthMiddleware.logout();
        }
      };

      // Show profile dropdown
      if (profileDropdown) {
        profileDropdown.style.display = "block";
      }

      // Update navbar avatar
      const navbarAvatar = document.getElementById("navbarAvatar");
      if (navbarAvatar && user.avatar) {
        navbarAvatar.src = user.avatar;
      }

      // Check admin access
      const hasAdminAccess = await AuthMiddleware.hasAnyPermission([
        "user:view",
        "role:view",
        "tour:create",
        "destination:create",
      ]);

      if (hasAdminAccess) {
        const adminDropdownItem = document.getElementById("adminDropdownItem");
        const adminDropdownLink = document.getElementById("adminDropdownLink");
        if (adminDropdownItem) adminDropdownItem.style.display = "block";
        if (adminDropdownLink) adminDropdownLink.style.display = "block";
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
// LOAD TOURS
// ========================================
async function loadTours() {
  const loading = document.getElementById("toursLoading");
  const scrollContainer = document.getElementById("toursScrollContainer");
  const container = document.getElementById("toursContainer");

  if (!loading || !scrollContainer || !container) return;

  try {
    const response = await API.get("/tours?limit=12&status=active");
    const data = response.data || response;
    const tours = data.tours || [];

    if (tours.length > 0) {
      container.innerHTML = tours
        .map((tour) => {
          // Get next available date
          let nextDate = null;
          if (tour.availableDates && tour.availableDates.length > 0) {
            const now = new Date();
            const futureDates = tour.availableDates
              .filter((d) => new Date(d.startDate) > now)
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            nextDate = futureDates[0];
          }

          return `
            <div>
              <div class="tour-card">
                <div class="card-image-wrapper">
                  <img
                    src="${
                      tour.coverImage ||
                      tour.images?.[0] ||
                      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80"
                    }"
                    alt="${tour.name}"
                    class="card-image"
                  />
                  ${
                    tour.featured
                      ? '<span class="card-badge"><i class="bi bi-star-fill"></i> Featured</span>'
                      : ""
                  }
                </div>
                <div class="card-body">
                  <div class="card-info">
                    <span class="info-item">
                      <i class="bi bi-clock"></i> ${tour.duration?.days || 0}D${
            tour.duration?.nights || 0
          }N
                    </span>
                    <span class="info-item">
                      <i class="bi bi-people"></i> ${tour.maxGroupSize || 0}
                    </span>
                  </div>
                  <h5 class="card-title">${tour.name}</h5>
                  <div class="card-location">
                    <i class="bi bi-geo-alt"></i>
                    <span>${
                      tour.destination?.name ||
                      tour.destinations?.[0]?.name ||
                      "Vietnam"
                    }</span>
                  </div>
                  ${
                    nextDate
                      ? `
                  <div class="card-date">
                    <i class="bi bi-calendar-check"></i>
                    <span>Next: ${new Date(
                      nextDate.startDate
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}</span>
                  </div>
                  `
                      : ""
                  }
                  <div class="card-price-section">
                    <div>
                      <div class="card-price-label">From</div>
                      <div class="card-price">${formatPrice(
                        tour.price?.adult || 0
                      )}</div>
                      <div class="card-price-per">per person</div>
                    </div>
                    <button class="card-book-btn" onclick="viewTourDetail('${
                      tour.slug
                    }')">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      container.innerHTML =
        '<div class="text-center"><p class="text-muted">No tours available</p></div>';
    }

    loading.style.display = "none";
    scrollContainer.style.display = "block";
  } catch (error) {
    console.error("Error loading tours:", error);
    loading.innerHTML = '<p class="text-danger">Unable to load tours</p>';
  }
}

// ========================================
// SCROLL TOURS
// ========================================
function scrollTours(direction) {
  const wrapper = document.getElementById("toursScrollWrapper");
  const scrollAmount = 400;

  if (direction === "prev") {
    wrapper.scrollLeft -= scrollAmount;
  } else {
    wrapper.scrollLeft += scrollAmount;
  }
}

// ========================================
// LOAD DESTINATIONS
// ========================================
async function loadDestinations() {
  const loading = document.getElementById("destinationsLoading");
  const container = document.getElementById("destinationsContainer");

  if (!loading || !container) return;

  try {
    const response = await API.get("/destinations?limit=8&status=active");

    // Backend returns { success, message, data: [...], pagination }
    // data is the array of destinations
    const destinations = response.data || [];

    if (destinations.length > 0) {
      container.innerHTML = destinations
        .map(
          (dest) => `
            <div class="destination-grid-card" onclick="viewDestinationDetail('${
              dest.id
            }')">
              <img
                src="${
                  dest.images?.[0] ||
                  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80"
                }"
                alt="${dest.name}"
              />
              <div class="destination-name">${dest.name}</div>
              <div class="destination-see-tours">
                <i class="bi bi-arrow-right-circle"></i> See Tours
              </div>
            </div>
          `
        )
        .join("");
    } else {
      container.innerHTML =
        '<div class="text-center"><p class="text-muted">No destinations available</p></div>';
    }

    loading.style.display = "none";
    container.style.display = "grid";
  } catch (error) {
    console.error("Error loading destinations:", error);
    loading.innerHTML =
      '<p class="text-danger">Unable to load destinations</p>';
  }
}

// ========================================
// VIEW DETAILS
// ========================================
function viewTourDetail(tour) {
  // Accept either tour object or slug string
  const slug = typeof tour === "string" ? tour : tour.slug;
  window.location.href = `/tour/details/?slug=${slug}`;
}

function viewDestinationDetail(id) {
  alert(`Destination detail: ${id}\n(Chức năng đang phát triển)`);
}

// ========================================
// FORMAT PRICE
// ========================================
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// ========================================
// INITIALIZE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadTours();
  loadDestinations();
});
