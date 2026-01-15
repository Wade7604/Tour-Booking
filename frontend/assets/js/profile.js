// Profile Page JavaScript

let currentUser = null;
let originalUserData = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfileData();
  await AuthMiddleware.setupPermissionUI();
  updateAuthButton();
});

// Load profile data from API
async function loadProfileData() {
  try {
    showLoading(true);
    hideError();

    const response = await API.getCurrentUser();

    if (response.success) {
      currentUser = response.data;
      originalUserData = { ...response.data };
      displayProfile(currentUser);
      showContent(true);
    } else {
      showError("Failed to load profile data.");
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    showError(error.message || "Failed to load profile.");
  } finally {
    showLoading(false);
  }
}

// Display profile data in view mode
function displayProfile(user) {
  // Avatar
  const avatarUrl = user.avatar || "https://via.placeholder.com/150";
  document.getElementById("viewAvatar").src = avatarUrl;
  document.getElementById("editAvatar").src = avatarUrl;

  // Profile info
  document.getElementById("viewFullName").textContent =
    user.fullName || "Not provided";
  document.getElementById("viewEmail").textContent = user.email || "-";
  document.getElementById("viewPhone").textContent = user.phone || "Not provided";
  document.getElementById("viewRole").textContent =
    user.roleDetails?.displayName || user.role || "User";

  // Format date
  if (user.createdAt) {
    const date = new Date(user.createdAt);
    document.getElementById("viewCreatedAt").textContent = date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }
}

// Enable edit mode
function enableEditMode() {
  // Populate form with current data
  document.getElementById("editFullName").value = currentUser.fullName || "";
  document.getElementById("editEmail").value = currentUser.email || "";
  document.getElementById("editPhone").value = currentUser.phone || "";

  // Toggle views
  document.getElementById("viewMode").style.display = "none";
  document.getElementById("editMode").style.display = "block";
}

// Cancel edit and return to view mode
function cancelEdit() {
  // Reset avatar
  const originalAvatar = originalUserData.avatar || "https://via.placeholder.com/150";
  document.getElementById("editAvatar").src = originalAvatar;

  // Toggle views
  document.getElementById("editMode").style.display = "none";
  document.getElementById("viewMode").style.display = "block";
}

// Handle avatar file selection
async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5MB.");
    return;
  }

  try {
    // Show loading state
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Uploading...';

    // Upload avatar using the proper API method
    const response = await API.uploadAvatar(file);

    if (response.success && response.data.url) {
      // Update preview
      document.getElementById("editAvatar").src = response.data.url;
      currentUser.avatar = response.data.url;
      showToast("Avatar uploaded successfully!");
    } else {
      throw new Error("Failed to upload image");
    }
  } catch (error) {
    console.error("Error uploading avatar:", error);
    alert("Failed to upload avatar. Please try again.");
  } finally {
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Changes';
  }
}

// Update profile
async function updateProfile(event) {
  event.preventDefault();

  const fullName = document.getElementById("editFullName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();

  // Validation
  if (!fullName) {
    alert("Full name is required.");
    return;
  }

  if (!email) {
    alert("Email is required.");
    return;
  }

  try {
    // Show loading state
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';

    // Prepare update data
    const updateData = {
      fullName,
      email,
      phone: phone || null,
      avatar: currentUser.avatar,
    };

    // Call API
    const response = await API.updateOwnProfile(updateData);

    if (response.success) {
      currentUser = response.data;
      originalUserData = { ...response.data };
      displayProfile(currentUser);
      cancelEdit();
      showToast("Profile updated successfully!");
    } else {
      throw new Error(response.message || "Failed to update profile");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    alert(error.message || "Failed to update profile. Please try again.");
  } finally {
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Changes';
  }
}

// UI Helper Functions
function showLoading(show) {
  document.getElementById("loadingSpinner").style.display = show
    ? "flex"
    : "none";
}

function showContent(show) {
  document.getElementById("profileContent").style.display = show
    ? "block"
    : "none";
}

function showError(message) {
  document.getElementById("errorText").textContent = message;
  document.getElementById("errorMessage").style.display = "block";
}

function hideError() {
  document.getElementById("errorMessage").style.display = "none";
}

function showToast(message) {
  const toastEl = document.getElementById("successToast");
  document.getElementById("toastMessage").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// Auth button handler
function updateAuthButton() {
  const token = localStorage.getItem("idToken");
  const authBtn = document.getElementById("authBtn");
  const profileDropdown = document.getElementById("profileDropdown");

  if (token) {
    authBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sign Out';
    authBtn.onclick = logout;
    
    // Show profile dropdown
    if (profileDropdown) {
      profileDropdown.style.display = "block";
    }
    
    // Show admin link if user has admin permissions
    checkAdminAccess();
  } else {
    authBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
    authBtn.onclick = () => (window.location.href = "/login");
    
    // Hide profile dropdown
    if (profileDropdown) {
      profileDropdown.style.display = "none";
    }
  }
}

// Check if user has admin access
async function checkAdminAccess() {
  const user = await AuthMiddleware.getCurrentUser();
  if (user) {
    const adminDropdownItem = document.getElementById("adminDropdownItem");
    const adminDropdownLink = document.getElementById("adminDropdownLink");
    const navbarAvatar = document.getElementById("navbarAvatar");
    
    // Update navbar avatar if available
    if (navbarAvatar && user.avatar) {
      navbarAvatar.src = user.avatar;
    }
    
    // Check if user has any admin permission (same as main.js)
    const hasAdminAccess = await AuthMiddleware.hasAnyPermission([
      "user:view",
      "role:view",
      "tour:create",
      "destination:create",
    ]);
    
    if (hasAdminAccess && adminDropdownItem && adminDropdownLink) {
      adminDropdownItem.style.display = "block";
      adminDropdownLink.style.display = "block";
    }
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
