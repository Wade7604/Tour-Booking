class UserManager {
  constructor() {
    this.currentPage = 1;
    this.limit = 20;
    this.searchTimeout = null;
    this.currentFilters = {};
    this.allRoles = [];
  }

  // Initialize
  async init() {
    this.setupEventListeners();
    await this.loadAllRoles(); // Load roles trước
    this.loadUsers();
    this.loadStatistics();
  }

  // Setup Event Listeners
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById("searchUsers");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.currentPage = 1;
          this.loadUsers(e.target.value);
        }, 500);
      });
    }

    // Filters
    const filterRole = document.getElementById("filterRole");
    const filterStatus = document.getElementById("filterStatus");
    const filterProvider = document.getElementById("filterProvider");

    if (filterRole) {
      filterRole.addEventListener("change", (e) => {
        this.currentFilters.role = e.target.value || undefined;
        this.currentPage = 1;
        this.loadUsers();
      });
    }

    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        this.currentFilters.status = e.target.value || undefined;
        this.currentPage = 1;
        this.loadUsers();
      });
    }

    if (filterProvider) {
      filterProvider.addEventListener("change", (e) => {
        this.currentFilters.provider = e.target.value || undefined;
        this.currentPage = 1;
        this.loadUsers();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshUsers");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadUsers();
        this.loadStatistics();
      });
    }

    // Reindex all button
    const reindexAllBtn = document.getElementById("reindexAll");
    if (reindexAllBtn) {
      reindexAllBtn.addEventListener("click", () => this.reindexAllUsers());
    }
  }
  async loadAllRoles() {
    try {
      const result = await API.request("/roles");
      if (result.success) {
        this.allRoles = result.data;
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      // Fallback về roles mặc định nếu API lỗi
      this.allRoles = [
        { name: "user", displayName: "User" },
        { name: "admin", displayName: "Admin" },
        { name: "guide", displayName: "Guide" },
      ];
    }
  }
  // Load Users
  async loadUsers(search = "") {
    const loading = document.getElementById("usersLoading");
    const table = document.getElementById("usersTable");

    if (loading) loading.style.display = "block";
    if (table) table.style.display = "none";

    try {
      const params = new URLSearchParams();
      params.append("page", this.currentPage);
      params.append("limit", this.limit);

      if (search) params.set("q", search);
      if (this.currentFilters.role)
        params.append("role", this.currentFilters.role);
      if (this.currentFilters.status)
        params.append("status", this.currentFilters.status);
      if (this.currentFilters.provider)
        params.append("provider", this.currentFilters.provider);

      const url = search ? `/users/search?${params}` : `/users?${params}`;
      const result = await API.request(url);

      if (result.success) {
        this.displayUsers(result.data);
        if (result.pagination) {
          this.displayPagination(result.pagination);
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
      this.showError("Failed to load users: " + error.message);
    } finally {
      if (loading) loading.style.display = "none";
      if (table) table.style.display = "block";
    }
  }

  // Display Users
  displayUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!users || users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
            <p class="mt-2">No users found</p>
          </td>
        </tr>
      `;
      return;
    }

    users.forEach((user) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <img src="${user.avatar || "https://via.placeholder.com/40"}" 
                 alt="${user.fullName}" 
                 class="rounded-circle me-2" 
                 style="width: 40px; height: 40px; object-fit: cover;">
            <div>
              <div class="fw-semibold">${user.fullName}</div>
              <small class="text-muted">${user.email}</small>
            </div>
          </div>
        </td>
        <td>${user.phone || '<span class="text-muted">N/A</span>'}</td>
        <td><span class="badge bg-primary">${user.role}</span></td>
        <td><span class="badge bg-info">${user.provider}</span></td>
        <td>
          <span class="badge bg-${
            user.status === "active" ? "success" : "danger"
          }">
            ${user.status}
          </span>
        </td>
        <td>
          <small class="text-muted">
            ${new Date(user.createdAt).toLocaleDateString("vi-VN")}
          </small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" 
                    onclick="userManager.viewUser('${user.id}')"
                    title="View Details">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" 
                    onclick="userManager.editUser('${user.id}')"
                    title="Edit User">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-info" 
                    onclick="userManager.reindexUser('${user.id}')"
                    title="Reindex">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" 
                    onclick="userManager.confirmDelete('${user.id}', '${
        user.fullName
      }')"
                    title="Delete User">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Display Pagination
  displayPagination(pagination) {
    const paginationEl = document.getElementById("usersPagination");
    if (!paginationEl) return;

    paginationEl.innerHTML = "";
    if (pagination.totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${
      pagination.currentPage === 1 ? "disabled" : ""
    }`;
    prevLi.innerHTML = `
      <a class="page-link" href="#" onclick="userManager.goToPage(${
        pagination.currentPage - 1
      }); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    `;
    paginationEl.appendChild(prevLi);

    // Page numbers
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    if (startPage > 1) {
      const firstLi = document.createElement("li");
      firstLi.className = "page-item";
      firstLi.innerHTML = `<a class="page-link" href="#" onclick="userManager.goToPage(1); return false;">1</a>`;
      paginationEl.appendChild(firstLi);

      if (startPage > 2) {
        const dotsLi = document.createElement("li");
        dotsLi.className = "page-item disabled";
        dotsLi.innerHTML = '<span class="page-link">...</span>';
        paginationEl.appendChild(dotsLi);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${
        i === pagination.currentPage ? "active" : ""
      }`;
      li.innerHTML = `<a class="page-link" href="#" onclick="userManager.goToPage(${i}); return false;">${i}</a>`;
      paginationEl.appendChild(li);
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        const dotsLi = document.createElement("li");
        dotsLi.className = "page-item disabled";
        dotsLi.innerHTML = '<span class="page-link">...</span>';
        paginationEl.appendChild(dotsLi);
      }

      const lastLi = document.createElement("li");
      lastLi.className = "page-item";
      lastLi.innerHTML = `<a class="page-link" href="#" onclick="userManager.goToPage(${pagination.totalPages}); return false;">${pagination.totalPages}</a>`;
      paginationEl.appendChild(lastLi);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${
      pagination.currentPage === pagination.totalPages ? "disabled" : ""
    }`;
    nextLi.innerHTML = `
      <a class="page-link" href="#" onclick="userManager.goToPage(${
        pagination.currentPage + 1
      }); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    `;
    paginationEl.appendChild(nextLi);
  }

  // Go to Page
  goToPage(page) {
    this.currentPage = page;
    const searchInput = document.getElementById("searchUsers");
    const searchTerm = searchInput ? searchInput.value : "";
    this.loadUsers(searchTerm);
  }

  // Load Statistics
  async loadStatistics() {
    try {
      const result = await API.request("/users/statistics");

      if (result.success) {
        this.displayStatistics(result.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }

  // Display Statistics
  displayStatistics(stats) {
    const totalUsersEl = document.getElementById("totalUsers");
    const activeUsersEl = document.getElementById("activeUsers");
    const inactiveUsersEl = document.getElementById("inactiveUsers");

    if (totalUsersEl) totalUsersEl.textContent = stats.total || 0;
    if (activeUsersEl) activeUsersEl.textContent = stats.byStatus?.active || 0;
    if (inactiveUsersEl)
      inactiveUsersEl.textContent = stats.byStatus?.inactive || 0;

    // Display role distribution
    const roleStatsEl = document.getElementById("roleStats");
    if (roleStatsEl && stats.byRole) {
      roleStatsEl.innerHTML = Object.entries(stats.byRole)
        .map(
          ([role, count]) => `
          <div class="d-flex justify-content-between mb-2">
            <span class="badge bg-primary">${role}</span>
            <span class="fw-semibold">${count}</span>
          </div>
        `
        )
        .join("");
    }
  }

  // View User Details
  async viewUser(userId) {
    try {
      const result = await API.request(`/users/${userId}`);

      if (result.success) {
        this.showViewModal(result.data);
      }
    } catch (error) {
      this.showError("Failed to load user details: " + error.message);
    }
  }

  // Show View Modal
  showViewModal(user) {
    const modalHtml = `
      <div class="modal fade" id="viewUserModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-person-circle"></i> User Details</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-4 text-center mb-3">
                  <img src="${
                    user.avatar || "https://via.placeholder.com/150"
                  }" 
                       class="rounded-circle img-thumbnail mb-3" 
                       style="width: 150px; height: 150px; object-fit: cover;">
                  <h5>${user.fullName}</h5>
                  <p class="text-muted">${user.email}</p>
                </div>
                <div class="col-md-8">
                  <table class="table table-borderless">
                    <tr>
                      <th width="40%"><i class="bi bi-telephone-fill text-primary"></i> Phone:</th>
                      <td>${user.phone || "N/A"}</td>
                    </tr>
                    <tr>
                      <th><i class="bi bi-shield-fill text-primary"></i> Role:</th>
                      <td><span class="badge bg-primary">${
                        user.role
                      }</span></td>
                    </tr>
                    <tr>
                      <th><i class="bi bi-flag-fill text-success"></i> Status:</th>
                      <td><span class="badge bg-${
                        user.status === "active" ? "success" : "danger"
                      }">${user.status}</span></td>
                    </tr>
                    <tr>
                      <th><i class="bi bi-box-arrow-in-right text-info"></i> Provider:</th>
                      <td><span class="badge bg-info">${
                        user.provider
                      }</span></td>
                    </tr>
                    <tr>
                      <th><i class="bi bi-calendar-plus text-warning"></i> Created:</th>
                      <td>${new Date(user.createdAt).toLocaleString(
                        "vi-VN"
                      )}</td>
                    </tr>
                    <tr>
                      <th><i class="bi bi-calendar-check text-success"></i> Updated:</th>
                      <td>${new Date(user.updatedAt).toLocaleString(
                        "vi-VN"
                      )}</td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> Close
              </button>
              <button type="button" class="btn btn-warning" onclick="userManager.editUser('${
                user.id
              }')">
                <i class="bi bi-pencil"></i> Edit User
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.removeModal("viewUserModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(document.getElementById("viewUserModal"));
    modal.show();
  }

  // Edit User
  async editUser(userId) {
    try {
      // Close view modal if open
      this.removeModal("viewUserModal");

      const result = await API.request(`/users/${userId}`);

      if (result.success) {
        this.showEditModal(result.data);
      }
    } catch (error) {
      this.showError("Failed to load user: " + error.message);
    }
  }
  // Cũng update showEditModal để hiển thị dynamic roles trong dropdown (disabled)
  showEditModal(user) {
    // Tạo options từ allRoles
    const roleOptions = this.allRoles
      .map(
        (role) => `
    <option value="${role.name}" ${user.role === role.name ? "selected" : ""}>
      ${role.displayName}
    </option>
  `
      )
      .join("");

    const modalHtml = `
    <div class="modal fade" id="editUserModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-warning text-white">
            <h5 class="modal-title"><i class="bi bi-pencil-square"></i> Edit User</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form id="editUserForm">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Full Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="editFullName" value="${
                    user.fullName
                  }" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" id="editEmail" value="${
                    user.email
                  }" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Phone</label>
                  <input type="tel" class="form-control" id="editPhone" value="${
                    user.phone || ""
                  }">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Avatar URL</label>
                  <input type="url" class="form-control" id="editAvatar" value="${
                    user.avatar || ""
                  }">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Role</label>
                  <select class="form-select" id="editRole" disabled>
                    ${roleOptions}
                  </select>
                  <small class="text-muted">Use "Update Role" button below to change role</small>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="editStatus" disabled>
                    <option value="active" ${
                      user.status === "active" ? "selected" : ""
                    }>Active</option>
                    <option value="inactive" ${
                      user.status === "inactive" ? "selected" : ""
                    }>Inactive</option>
                  </select>
                  <small class="text-muted">Use "Update Status" button below to change status</small>
                </div>
              </div>
              
              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> You can only update basic info (name, email, phone, avatar). Use the buttons below for role/status changes.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> Cancel
              </button>
              <button type="button" class="btn btn-info" onclick="userManager.showUpdateRoleModal('${
                user.id
              }', '${user.role}')">
                <i class="bi bi-shield-fill"></i> Update Role
              </button>
              <button type="button" class="btn btn-warning" onclick="userManager.showUpdateStatusModal('${
                user.id
              }', '${user.status}')">
                <i class="bi bi-flag-fill"></i> Update Status
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-check-circle"></i> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

    this.removeModal("editUserModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
    modal.show();

    document.getElementById("editUserForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveUserEdits(user.id);
    });
  }

  // Save User Edits
  async saveUserEdits(userId) {
    const submitBtn = document.querySelector(
      "#editUserForm button[type='submit']"
    );
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Saving...';

    try {
      const updateData = {
        fullName: document.getElementById("editFullName").value,
        email: document.getElementById("editEmail").value,
        phone: document.getElementById("editPhone").value || null,
        avatar: document.getElementById("editAvatar").value || null,
      };

      const result = await API.request(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (result.success) {
        this.showSuccess("User updated successfully!");
        this.removeModal("editUserModal");
        this.loadUsers();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to update user: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  // Sửa lại showUpdateRoleModal để dùng dynamic roles
  showUpdateRoleModal(userId, currentRole) {
    // Tạo options từ allRoles
    const roleOptions = this.allRoles
      .map(
        (role) => `
    <option value="${role.name}" ${currentRole === role.name ? "selected" : ""}>
      ${role.displayName}
    </option>
  `
      )
      .join("");

    const modalHtml = `
    <div class="modal fade" id="updateRoleModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title"><i class="bi bi-shield-fill"></i> Update User Role</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form id="updateRoleForm">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Select New Role</label>
                <select class="form-select" id="newRole" required>
                  ${roleOptions}
                </select>
              </div>
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> Changing user role will affect their permissions!
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-info">
                <i class="bi bi-check-circle"></i> Update Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

    this.removeModal("updateRoleModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(
      document.getElementById("updateRoleModal")
    );
    modal.show();

    document
      .getElementById("updateRoleForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.updateUserRole(userId);
      });
  }

  // Update User Role
  async updateUserRole(userId) {
    const submitBtn = document.querySelector(
      "#updateRoleForm button[type='submit']"
    );
    submitBtn.disabled = true;

    try {
      const role = document.getElementById("newRole").value;

      const result = await API.request(`/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });

      if (result.success) {
        this.showSuccess("User role updated successfully!");
        this.removeModal("updateRoleModal");
        this.removeModal("editUserModal");
        this.loadUsers();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to update role: " + error.message);
    } finally {
      submitBtn.disabled = false;
    }
  }

  // Show Update Status Modal
  showUpdateStatusModal(userId, currentStatus) {
    const modalHtml = `
      <div class="modal fade" id="updateStatusModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-warning text-white">
              <h5 class="modal-title"><i class="bi bi-flag-fill"></i> Update User Status</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form id="updateStatusForm">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Select New Status</label>
                  <select class="form-select" id="newStatus" required>
                    <option value="active" ${
                      currentStatus === "active" ? "selected" : ""
                    }>Active</option>
                    <option value="inactive" ${
                      currentStatus === "inactive" ? "selected" : ""
                    }>Inactive</option>
                  </select>
                </div>
                <div class="alert alert-info">
                  <i class="bi bi-info-circle"></i> Inactive users cannot access the system.
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-warning">
                  <i class="bi bi-check-circle"></i> Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.removeModal("updateStatusModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(
      document.getElementById("updateStatusModal")
    );
    modal.show();

    document
      .getElementById("updateStatusForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.updateUserStatus(userId);
      });
  }

  // Update User Status
  async updateUserStatus(userId) {
    const submitBtn = document.querySelector(
      "#updateStatusForm button[type='submit']"
    );
    submitBtn.disabled = true;

    try {
      const status = document.getElementById("newStatus").value;

      const result = await API.request(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (result.success) {
        this.showSuccess("User status updated successfully!");
        this.removeModal("updateStatusModal");
        this.removeModal("editUserModal");
        this.loadUsers();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to update status: " + error.message);
    } finally {
      submitBtn.disabled = false;
    }
  }

  // Confirm Delete
  confirmDelete(userId, userName) {
    const modalHtml = `
      <div class="modal fade" id="deleteUserModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="bi bi-exclamation-triangle"></i> Delete User</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Warning!</strong> This action cannot be undone.
              </div>
              <p>Are you sure you want to delete this user?</p>
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">${userName}</h6>
                  <p class="card-text text-muted mb-0">User ID: ${userId}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> Cancel
              </button>
              <button type="button" class="btn btn-danger" onclick="userManager.deleteUser('${userId}')">
                <i class="bi bi-trash"></i> Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.removeModal("deleteUserModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(
      document.getElementById("deleteUserModal")
    );
    modal.show();
  }

  // Delete User
  async deleteUser(userId) {
    const deleteBtn = document.querySelector("#deleteUserModal .btn-danger");
    deleteBtn.disabled = true;
    deleteBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Deleting...';

    try {
      const result = await API.request(`/users/${userId}`, {
        method: "DELETE",
      });

      if (result.success) {
        this.showSuccess("User deleted successfully!");
        this.removeModal("deleteUserModal");
        this.loadUsers();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to delete user: " + error.message);
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Yes, Delete User';
    }
  }

  // Reindex User
  async reindexUser(userId) {
    try {
      const result = await API.request(`/users/${userId}/reindex`, {
        method: "POST",
      });

      if (result.success) {
        this.showSuccess("User reindexed to Elasticsearch successfully!");
      }
    } catch (error) {
      this.showError("Failed to reindex user: " + error.message);
    }
  }

  // Reindex All Users
  async reindexAllUsers() {
    if (
      !confirm(
        "This will reindex all users to Elasticsearch. This may take a while. Continue?"
      )
    ) {
      return;
    }

    try {
      this.showInfo("Starting reindex process...");

      const result = await API.request("/users/elasticsearch/reindex", {
        method: "POST",
      });

      if (result.success) {
        this.showSuccess(
          `Successfully reindexed ${result.data.indexed} users!`
        );
      }
    } catch (error) {
      this.showError("Failed to reindex users: " + error.message);
    }
  }
  removeModal(modalId) {
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      // 1. Lấy instance của Bootstrap Modal nếu có và ẩn nó đi
      const modalInstance = bootstrap.Modal.getInstance(existingModal);
      if (modalInstance) {
        modalInstance.hide();
      }
      // 2. Xóa phần tử khỏi HTML
      existingModal.remove();

      // 3. Dọn dẹp lớp nền mờ (backdrop) và reset body class (lỗi phổ biến của Bootstrap)
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }
  // Toast notifications
  showSuccess(message) {
    this.showToast(message, "success");
  }

  showError(message) {
    this.showToast(message, "danger");
  }

  showInfo(message) {
    this.showToast(message, "info");
  }

  showToast(message, type = "info") {
    const toastHtml = `
      <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML("beforeend", toastHtml);

    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  }
}

// Initialize when DOM is loaded
let userManager;
document.addEventListener("DOMContentLoaded", () => {
  userManager = new UserManager();
  userManager.init();
});
