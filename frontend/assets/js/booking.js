// Booking Form Logic
let currentStep = 1;
let tourData = null;
let bookingData = {
  tourId: null,
  selectedDate: null,
  numberOfAdults: 1,
  numberOfChildren: 0,
  numberOfInfants: 0,
  customerInfo: {},
  participants: [],
  specialRequests: "",
};

// Get tour ID from URL
function getTourIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("tourId") || urlParams.get("id");
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Initialize page
async function initBookingPage() {
  const tourId = getTourIdFromUrl();
  
  // Debug log
  console.log("Current URL:", window.location.href);
  console.log("Tour ID from URL:", tourId);
  
  // Clean URL - remove index.html from URL bar
  if (window.location.pathname.includes('index.html')) {
    const cleanUrl = window.location.href.replace('/index.html', '/');
    window.history.replaceState({}, '', cleanUrl);
  }

  if (!tourId) {
    showError("No tour selected");
    return;
  }

  bookingData.tourId = tourId;

  try {
    // Show loading
    document.getElementById("loadingSpinner").style.display = "flex";

    // Check if user is authenticated with backend verification
    const user = await AuthMiddleware.getCurrentUser();
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `/login?redirect=${returnUrl}`;
      return;
    }
    
    // Check if user has booking:create permission
    const hasPermission = await AuthMiddleware.hasPermission('booking:create');
    if (!hasPermission) {
      showError("You don't have permission to create bookings. Please contact admin.");
      return;
    }

    // Fetch tour details - try by ID first, then by slug
    let response;
    try {
      response = await API.get(`/tours/${tourId}`);
    } catch (error) {
      // If ID fails, try slug
      response = await API.get(`/tours/slug/${tourId}`);
    }

    if (!response.success) {
      throw new Error(response.message || "Failed to load tour");
    }

    tourData = response.data;
    
    // Update bookingData with actual tour ID (in case we used slug)
    bookingData.tourId = tourData.id;

    // Populate available dates
    populateAvailableDates();

    // Update tour summary
    updateTourSummary();

    // Calculate initial pricing
    calculatePricing();

    // Hide loading, show form
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("bookingForm").style.display = "block";
  } catch (error) {
    console.error("Error loading tour:", error);
    showError(error.message);
  }
}

// Populate available dates dropdown
function populateAvailableDates() {
  const select = document.getElementById("selectedDate");
  select.innerHTML = '<option value="">Choose a date...</option>';

  if (!tourData.availableDates || tourData.availableDates.length === 0) {
    select.innerHTML = '<option value="">No dates available</option>';
    select.disabled = true;
    return;
  }

  tourData.availableDates.forEach((dateObj, index) => {
    const startDate = new Date(dateObj.startDate);
    const endDate = new Date(dateObj.endDate);
    const today = new Date();

    // Only show future dates
    if (startDate > today) {
      const availableSlots = dateObj.availableSlots || 0;
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${formatDate(dateObj.startDate)} - ${formatDate(
        dateObj.endDate
      )} (${availableSlots} slots available)`;
      option.dataset.startDate = dateObj.startDate;
      option.dataset.endDate = dateObj.endDate;
      option.dataset.availableSlots = availableSlots;
      select.appendChild(option);
    }
  });

  // Add change listener
  select.addEventListener("change", (e) => {
    if (e.target.value) {
      const option = e.target.options[e.target.selectedIndex];
      bookingData.selectedDate = {
        startDate: option.dataset.startDate,
        endDate: option.dataset.endDate,
      };
    }
  });
}

// Update tour summary
function updateTourSummary() {
  document.getElementById("tourNameSummary").textContent = tourData.name;
  if (tourData.coverImage) {
    document.getElementById("tourImageSmall").src = tourData.coverImage;
  }
}

// Increase/Decrease participant count
function increaseValue(type) {
  const input = document.getElementById(type);
  const currentValue = parseInt(input.value);
  const maxValue = parseInt(input.max);

  if (currentValue < maxValue) {
    input.value = currentValue + 1;
    updateParticipantCount(type, currentValue + 1);
  }
}

function decreaseValue(type) {
  const input = document.getElementById(type);
  const currentValue = parseInt(input.value);
  const minValue = parseInt(input.min);

  if (currentValue > minValue) {
    input.value = currentValue - 1;
    updateParticipantCount(type, currentValue - 1);
  }
}

// Update participant count
function updateParticipantCount(type, value) {
  if (type === "adults") bookingData.numberOfAdults = value;
  if (type === "children") bookingData.numberOfChildren = value;
  if (type === "infants") bookingData.numberOfInfants = value;

  const total =
    bookingData.numberOfAdults +
    bookingData.numberOfChildren +
    bookingData.numberOfInfants;
  document.getElementById("totalParticipants").textContent = total;

  calculatePricing();
}

// Calculate pricing
function calculatePricing() {
  if (!tourData || !tourData.price) return;

  const adultPrice = tourData.price.adult || tourData.price || 0;
  const childPrice = tourData.price.child || adultPrice * 0.7 || 0;
  const infantPrice = tourData.price.infant || 0;

  const adultTotal = adultPrice * bookingData.numberOfAdults;
  const childTotal = childPrice * bookingData.numberOfChildren;
  const infantTotal = infantPrice * bookingData.numberOfInfants;

  const subtotal = adultTotal + childTotal + infantTotal;
  const deposit = Math.round(subtotal * 0.4); // 40% deposit
  const total = subtotal;

  // Update sidebar
  document.getElementById("adultCount").textContent = bookingData.numberOfAdults;
  document.getElementById("childCount").textContent =
    bookingData.numberOfChildren;
  document.getElementById("infantCount").textContent =
    bookingData.numberOfInfants;

  document.getElementById("adultTotal").textContent = formatCurrency(adultTotal);
  document.getElementById("childTotal").textContent = formatCurrency(childTotal);
  document.getElementById("infantTotal").textContent =
    formatCurrency(infantTotal);

  document.getElementById("subtotalAmount").textContent =
    formatCurrency(subtotal);
  document.getElementById("depositAmount").textContent = formatCurrency(deposit);
  document.getElementById("totalAmount").textContent = formatCurrency(total);
}

// Step navigation
function nextStep() {
  if (!validateCurrentStep()) {
    return;
  }

  // Save current step data
  saveStepData();

  // Move to next step
  if (currentStep < 4) {
    currentStep++;
    updateStepDisplay();

    // Generate participant forms if moving to step 3
    if (currentStep === 3) {
      generateParticipantForms();
    }

    // Generate review if moving to step 4
    if (currentStep === 4) {
      generateReview();
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
  }
}

// Update step display
function updateStepDisplay() {
  // Update progress indicators
  document.querySelectorAll(".progress-step").forEach((step, index) => {
    if (index + 1 < currentStep) {
      step.classList.add("completed");
      step.classList.remove("active");
    } else if (index + 1 === currentStep) {
      step.classList.add("active");
      step.classList.remove("completed");
    } else {
      step.classList.remove("active", "completed");
    }
  });

  // Show/hide form steps
  document.querySelectorAll(".form-step").forEach((step, index) => {
    step.classList.toggle("active", index + 1 === currentStep);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Validate current step
function validateCurrentStep() {
  if (currentStep === 1) {
    const selectedDate = document.getElementById("selectedDate").value;
    const totalParticipants =
      bookingData.numberOfAdults +
      bookingData.numberOfChildren +
      bookingData.numberOfInfants;

    if (!selectedDate) {
      alert("Please select a departure date");
      return false;
    }

    if (totalParticipants === 0) {
      alert("Please select at least one participant");
      return false;
    }

    // Check min/max group size
    if (tourData.minGroupSize && totalParticipants < tourData.minGroupSize) {
      alert(`Minimum group size is ${tourData.minGroupSize} people`);
      return false;
    }

    // Check available slots for the selected date
    const dateSelect = document.getElementById("selectedDate");
    const selectedOption = dateSelect.options[dateSelect.selectedIndex];
    const availableSlots = parseInt(selectedOption.dataset.availableSlots) || 0;

    if (totalParticipants > availableSlots) {
      alert(`Only ${availableSlots} slots available for this date. Please reduce the number of participants.`);
      return false;
    }

    return true;
  }

  if (currentStep === 2) {
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!fullName || !email || !phone) {
      alert("Please fill in all required fields");
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return false;
    }

    return true;
  }

  if (currentStep === 3) {
    // Validate participant forms
    const forms = document.querySelectorAll(".participant-form");
    for (let form of forms) {
      const name = form.querySelector(".participant-name").value.trim();
      if (!name) {
        alert("Please fill in all participant names");
        return false;
      }
    }
    return true;
  }

  if (currentStep === 4) {
    const termsAccepted = document.getElementById("termsAccepted").checked;
    if (!termsAccepted) {
      alert("Please accept the terms and conditions");
      return false;
    }
    return true;
  }

  return true;
}

// Save step data
function saveStepData() {
  if (currentStep === 2) {
    bookingData.customerInfo = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      nationality: document.getElementById("nationality").value.trim(),
      address: document.getElementById("address").value.trim(),
      passportNumber: document.getElementById("passportNumber").value.trim(),
    };

    bookingData.emergencyContact = {
      name: document.getElementById("emergencyName").value.trim(),
      relationship: document.getElementById("emergencyRelationship").value.trim(),
      phone: document.getElementById("emergencyPhone").value.trim(),
    };
  }

  if (currentStep === 3) {
    bookingData.specialRequests =
      document.getElementById("specialRequests").value.trim();

    // Collect participant data
    bookingData.participants = [];
    document.querySelectorAll(".participant-form").forEach((form) => {
      bookingData.participants.push({
        type: form.dataset.type,
        fullName: form.querySelector(".participant-name").value.trim(),
        dateOfBirth: form.querySelector(".participant-dob").value,
        gender: form.querySelector(".participant-gender").value,
        passportNumber: form.querySelector(".participant-passport").value.trim(),
      });
    });
  }
}

// Generate participant forms
function generateParticipantForms() {
  const container = document.getElementById("participantForms");
  container.innerHTML = "";

  let participantIndex = 1;

  // Generate forms for adults
  for (let i = 0; i < bookingData.numberOfAdults; i++) {
    container.appendChild(
      createParticipantForm("adult", participantIndex++, i + 1)
    );
  }

  // Generate forms for children
  for (let i = 0; i < bookingData.numberOfChildren; i++) {
    container.appendChild(
      createParticipantForm("child", participantIndex++, i + 1)
    );
  }

  // Generate forms for infants
  for (let i = 0; i < bookingData.numberOfInfants; i++) {
    container.appendChild(
      createParticipantForm("infant", participantIndex++, i + 1)
    );
  }
}

// Create participant form
function createParticipantForm(type, index, typeIndex) {
  const div = document.createElement("div");
  div.className = "participant-form";
  div.dataset.type = type;

  const typeLabel = {
    adult: "Adult",
    child: "Child",
    infant: "Infant",
  }[type];

  div.innerHTML = `
    <h4 class="participant-form-title">
      <i class="bi bi-person"></i> ${typeLabel} ${typeIndex}
    </h4>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label required">Full Name</label>
        <input type="text" class="form-control participant-name" required>
      </div>
      <div class="col-md-6">
        <label class="form-label">Date of Birth</label>
        <input type="date" class="form-control participant-dob">
      </div>
      <div class="col-md-6">
        <label class="form-label">Gender</label>
        <select class="form-select participant-gender">
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Passport Number</label>
        <input type="text" class="form-control participant-passport">
      </div>
    </div>
  `;

  return div;
}

// Generate review
function generateReview() {
  // Tour details
  const tourDetails = `
    <div class="review-item">
      <span class="review-label">Tour Name:</span>
      <span class="review-value">${tourData.name}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Departure:</span>
      <span class="review-value">${formatDate(
        bookingData.selectedDate.startDate
      )}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Return:</span>
      <span class="review-value">${formatDate(
        bookingData.selectedDate.endDate
      )}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Participants:</span>
      <span class="review-value">${bookingData.numberOfAdults} adults, ${
    bookingData.numberOfChildren
  } children, ${bookingData.numberOfInfants} infants</span>
    </div>
  `;
  document.getElementById("reviewTourDetails").innerHTML = tourDetails;

  // Customer info
  const customerInfo = `
    <div class="review-item">
      <span class="review-label">Name:</span>
      <span class="review-value">${bookingData.customerInfo.fullName}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Email:</span>
      <span class="review-value">${bookingData.customerInfo.email}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Phone:</span>
      <span class="review-value">${bookingData.customerInfo.phone}</span>
    </div>
  `;
  document.getElementById("reviewCustomerInfo").innerHTML = customerInfo;

  // Participants
  let participantsHtml = "";
  bookingData.participants.forEach((p, i) => {
    participantsHtml += `
      <div class="review-participant">
        <strong>${i + 1}. ${p.fullName}</strong> (${p.type})
      </div>
    `;
  });
  document.getElementById("reviewParticipants").innerHTML = participantsHtml;
}

// Submit booking
async function submitBooking() {
  if (!validateCurrentStep()) {
    return;
  }

  const submitBtn = document.getElementById("submitBookingBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

  try {
    const response = await API.post("/bookings", bookingData);

    if (!response.success) {
      throw new Error(response.message || "Failed to create booking");
    }

    // Redirect to confirmation page
    window.location.href = `/booking/confirmation/?bookingId=${response.data.id}`;
  } catch (error) {
    console.error("Error creating booking:", error);
    alert("Failed to create booking: " + error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      '<i class="bi bi-check-circle"></i> Confirm Booking';
  }
}

// Show error
function showError(message) {
  document.getElementById("loadingSpinner").style.display = "none";
  document.getElementById("errorText").textContent = message;
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
  checkAuth();
  initBookingPage();
});
