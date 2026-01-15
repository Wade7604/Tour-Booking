// Navbar Authentication Helper
// Use this to initialize navbar profile dropdown on any page

function initNavbarAuth() {
  const profileDropdown = document.getElementById("profileDropdown");
  const authBtn = document.getElementById("authBtn");
  const navbarAvatar = document.getElementById("navbarAvatar");
  
  // Check if user is logged in
  const token = localStorage.getItem("idToken");
  
  if (token && profileDropdown) {
    // Show profile dropdown
    profileDropdown.style.display = "block";
    
    // Update auth button
    if (authBtn) {
      authBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sign Out';
      authBtn.onclick = () => {
        if (confirm("Are you sure you want to sign out?")) {
          localStorage.removeItem("idToken");
          window.location.href = "/login";
        }
      };
    }
    
    // Load user data and update avatar
    loadNavbarUserData();
  } else if (authBtn) {
    authBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
    authBtn.onclick = () => window.location.href = "/login";
  }
}

async function loadNavbarUserData() {
  try {
    const user = await AuthMiddleware.getCurrentUser();
    if (!user) return;
    
    // Update avatar
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
  } catch (error) {
    console.error("Error loading navbar user data:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavbarAuth);
} else {
  initNavbarAuth();
}
