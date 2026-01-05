class RoleManager {
  constructor() {
    this.currentPage = 1;
    this.limit = 20;
    this.searchTimeout = null;
    this.currentFilters = {};
    this.allPermissions = [];
    this.selectedPermissions = [];
  }

  async init() {
    this.setupEventListeners();
    await this.loadAllPermissions();
    this.loadRoles();
    this.loadStatistics();
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchRoles");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.currentPage = 1;
          this.loadRoles(e.target.value);
        }, 500);
      });
    }

    const filterType = document.getElementById("filterType");
    if (filterType) {
      filterType.addEventListener("change", (e) => {
        this.currentFilters.type = e.target.value || undefined;
        this.currentPage = 1;
        this.loadRoles();
      });
    }

    const refreshBtn = document.getElementById("refreshRoles");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadRoles();
        this.loadStatistics();
      });
    }
  }

  async loadAllPermissions() {
    try {
      const result = await API.request("/permissions");
      if (result.success) {
        this.allPermissions = result.data;
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  }

  async loadRoles(search = "") {
    const loading = document.getElementById("rolesLoading");
    const table = document.getElementById("rolesTable");

    if (loading) loading.style.display = "block";
    if (table) table.style.display = "none";

    try {
      const params = new URLSearchParams();
      params.append("page", this.currentPage);
      params.append("limit", this.limit);

      const result = await API.request(`/roles?${params}`);

      if (result.success) {
        let roles = result.data;

        // Filter by search term
        if (search) {
          roles = roles.filter(
            (r) =>
              r.name.toLowerCase().includes(search.toLowerCase()) ||
              r.displayName.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Filter by type
        if (this.currentFilters.type === "system") {
          roles = roles.filter((r) => r.isSystem);
        } else if (this.currentFilters.type === "custom") {
          roles = roles.filter((r) => !r.isSystem);
        }

        this.displayRoles(roles);
        if (result.pagination) {
          this.displayPagination(result.pagination);
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      this.showError("Failed to load roles: " + error.message);
    } finally {
      if (loading) loading.style.display = "none";
      if (table) table.style.display = "block";
    }
  }

  displayRoles(roles) {
    const tbody = document.getElementById("rolesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!roles || roles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
            <p class="mt-2">No roles found</p>
          </td>
        </tr>
      `;
      return;
    }

    roles.forEach((role) => {
      const tr = document.createElement("tr");
      const permissionCount = role.permissions ? role.permissions.length : 0;

      tr.innerHTML = `
        <td>
          <span class="fw-semibold">${role.name}</span>
        </td>
        <td>${role.displayName}</td>
        <td>
          ${
            role.isSystem
              ? '<span class="badge bg-success"><i class="bi bi-shield-check"></i> System</span>'
              : '<span class="badge bg-info"><i class="bi bi-shield-plus"></i> Custom</span>'
          }
        </td>
        <td>
          <span class="badge bg-primary">${permissionCount} permissions</span>
          <button class="btn btn-sm btn-link" onclick="roleManager.viewRolePermissions('${
            role.id
          }')">
            <i class="bi bi-eye"></i> View
          </button>
        </td>
        <td>
          <small class="text-muted">${role.description || "N/A"}</small>
        </td>
        <td>
          <small class="text-muted">
            ${new Date(role.createdAt).toLocaleDateString("vi-VN")}
          </small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" 
                    onclick="roleManager.viewRole('${role.id}')"
                    title="View Details">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" 
                    onclick="roleManager.editRole('${role.id}')"
                    title="Edit Role"
                    ${role.isSystem ? "disabled" : ""}>
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-info" 
                    onclick="roleManager.managePermissions('${role.id}')"
                    title="Manage Permissions">
              <i class="bi bi-key-fill"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" 
                    onclick="roleManager.confirmDelete('${role.id}', '${
        role.name
      }')"
                    title="Delete Role"
                    ${role.isSystem ? "disabled" : ""}>
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  displayPagination(pagination) {
    const paginationEl = document.getElementById("rolesPagination");
    if (!paginationEl) return;

    paginationEl.innerHTML = "";
    if (pagination.totalPages <= 1) return;

    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${
      pagination.currentPage === 1 ? "disabled" : ""
    }`;
    prevLi.innerHTML = `
      <a class="page-link" href="#" onclick="roleManager.goToPage(${
        pagination.currentPage - 1
      }); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    `;
    paginationEl.appendChild(prevLi);

    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${
        i === pagination.currentPage ? "active" : ""
      }`;
      li.innerHTML = `<a class="page-link" href="#" onclick="roleManager.goToPage(${i}); return false;">${i}</a>`;
      paginationEl.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${
      pagination.currentPage === pagination.totalPages ? "disabled" : ""
    }`;
    nextLi.innerHTML = `
      <a class="page-link" href="#" onclick="roleManager.goToPage(${
        pagination.currentPage + 1
      }); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    `;
    paginationEl.appendChild(nextLi);
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadRoles();
  }

  async loadStatistics() {
    try {
      const result = await API.request("/roles");
      if (result.success) {
        const roles = result.data;
        const systemRoles = roles.filter((r) => r.isSystem).length;
        const customRoles = roles.filter((r) => !r.isSystem).length;
        const totalPermissions = roles.reduce(
          (sum, r) => sum + (r.permissions?.length || 0),
          0
        );
        const avgPermissions =
          roles.length > 0 ? Math.round(totalPermissions / roles.length) : 0;

        document.getElementById("totalRoles").textContent = roles.length;
        document.getElementById("systemRoles").textContent = systemRoles;
        document.getElementById("customRoles").textContent = customRoles;
        document.getElementById("avgPermissions").textContent = avgPermissions;
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }

  showCreateModal() {
    this.selectedPermissions = [];

    const modalHtml = `
      <div class="modal fade" id="createRoleModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-plus-circle"></i> Create Role</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form id="createRoleForm">
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Role Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="createName" placeholder="e.g., manager" required>
                    <small class="text-muted">Lowercase, no spaces</small>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Display Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="createDisplayName" placeholder="e.g., Manager" required>
                  </div>
                  <div class="col-12 mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="createDescription" rows="2" placeholder="Describe the role..."></textarea>
                  </div>
                  <div class="col-12 mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="createIsSystem">
                      <label class="form-check-label" for="createIsSystem">
                        System Role <small class="text-muted">(Cannot be deleted)</small>
                      </label>
                    </div>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Permissions</label>
                    <div class="input-group mb-2">
                      <input type="text" class="form-control" id="permissionSearch" placeholder="Search permissions...">
                      <button type="button" class="btn btn-outline-secondary" onclick="roleManager.clearPermissionSearch()">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                    <div class="permission-list border rounded p-3" id="permissionList">
                      ${this.renderPermissionList()}
                    </div>
                    <small class="text-muted">Selected: <span id="selectedCount">0</span> permissions</small>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle"></i> Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check-circle"></i> Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.removeModal("createRoleModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(
      document.getElementById("createRoleModal")
    );
    modal.show();

    document
      .getElementById("permissionSearch")
      .addEventListener("input", (e) => {
        this.filterPermissionList(e.target.value);
      });

    document
      .getElementById("createRoleForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.createRole();
      });
  }

  renderPermissionList() {
    return this.allPermissions
      .map(
        (perm) => `
      <div class="form-check mb-2">
        <input class="form-check-input permission-checkbox" type="checkbox" 
               value="${perm.name}" id="perm_${perm.id}"
               onchange="roleManager.togglePermission('${perm.name}')">
        <label class="form-check-label" for="perm_${perm.id}">
          <strong>${perm.name}</strong>
          <br><small class="text-muted">${
            perm.description || "No description"
          }</small>
        </label>
      </div>
    `
      )
      .join("");
  }

  togglePermission(permName) {
    const index = this.selectedPermissions.indexOf(permName);
    if (index > -1) {
      this.selectedPermissions.splice(index, 1);
    } else {
      this.selectedPermissions.push(permName);
    }

    const countEl = document.getElementById("selectedCount");
    if (countEl) {
      countEl.textContent = this.selectedPermissions.length;
    }
  }

  filterPermissionList(search) {
    const checkboxes = document.querySelectorAll(".permission-checkbox");
    checkboxes.forEach((cb) => {
      const label = cb.nextElementSibling;
      const text = label.textContent.toLowerCase();
      const parent = cb.parentElement;

      if (text.includes(search.toLowerCase())) {
        parent.style.display = "block";
      } else {
        parent.style.display = "none";
      }
    });
  }

  clearPermissionSearch() {
    const searchInput = document.getElementById("permissionSearch");
    if (searchInput) {
      searchInput.value = "";
      this.filterPermissionList("");
    }
  }

  async createRole() {
    const submitBtn = document.querySelector(
      "#createRoleForm button[type='submit']"
    );
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Creating...';

    try {
      const data = {
        name: document.getElementById("createName").value,
        displayName: document.getElementById("createDisplayName").value,
        description: document.getElementById("createDescription").value || null,
        isSystem: document.getElementById("createIsSystem").checked,
        permissions: this.selectedPermissions,
      };

      const result = await API.request("/roles", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (result.success) {
        this.showSuccess("Role created successfully!");
        this.removeModal("createRoleModal");
        this.loadRoles();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to create role: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Create Role';
    }
  }

  async viewRole(roleId) {
    try {
      const result = await API.request(
        `/roles/${roleId}?includePermissions=true`
      );
      if (result.success) {
        this.showViewModal(result.data);
      }
    } catch (error) {
      this.showError("Failed to load role: " + error.message);
    }
  }

  showViewModal(role) {
    const permissionsList =
      role.permissions && role.permissions.length > 0
        ? role.permissions
            .map((p) => `<span class="badge bg-primary me-1 mb-1">${p}</span>`)
            .join("")
        : '<span class="text-muted">No permissions assigned</span>';

    const modalHtml = `
      <div class="modal fade" id="viewRoleModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-shield-fill"></i> Role Details</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <table class="table table-borderless">
                <tr>
                  <th width="30%"><i class="bi bi-tag-fill text-primary"></i> Role Name:</th>
                  <td><strong>${role.name}</strong></td>
                </tr>
                <tr>
                  <th><i class="bi bi-type text-info"></i> Display Name:</th>
                  <td>${role.displayName}</td>
                </tr>
                <tr>
                  <th><i class="bi bi-shield-check text-success"></i> Type:</th>
                  <td>
                    ${
                      role.isSystem
                        ? '<span class="badge bg-success">System Role</span>'
                        : '<span class="badge bg-info">Custom Role</span>'
                    }
                  </td>
                </tr>
                <tr>
                  <th><i class="bi bi-file-text text-warning"></i> Description:</th>
                  <td>${role.description || "N/A"}</td>
                </tr>
                <tr>
                  <th><i class="bi bi-calendar-plus text-secondary"></i> Created:</th>
                  <td>${new Date(role.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
                <tr>
                  <th><i class="bi bi-calendar-check text-secondary"></i> Updated:</th>
                  <td>${new Date(role.updatedAt).toLocaleString("vi-VN")}</td>
                </tr>
              </table>
              
              <hr>
              
              <h6><i class="bi bi-key-fill"></i> Permissions (${
                role.permissions?.length || 0
              })</h6>
              <div class="p-3 border rounded">
                ${permissionsList}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> Close
              </button>
              ${
                !role.isSystem
                  ? `
                <button type="button" class="btn btn-warning" onclick="roleManager.editRole('${role.id}')">
                  <i class="bi bi-pencil"></i> Edit Role
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;

    this.removeModal("viewRoleModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(document.getElementById("viewRoleModal"));
    modal.show();
  }

  async viewRolePermissions(roleId) {
    try {
      const result = await API.request(
        `/roles/${roleId}?includePermissions=true`
      );
      if (result.success) {
        const role = result.data;
        const permissionsList =
          role.permissions && role.permissions.length > 0
            ? role.permissions
                .map((p) => `<li class="list-group-item">${p}</li>`)
                .join("")
            : '<li class="list-group-item text-muted">No permissions assigned</li>';

        const modalHtml = `
          <div class="modal fade" id="viewPermissionsModal" tabindex="-1">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header bg-info text-white">
                  <h5 class="modal-title"><i class="bi bi-key-fill"></i> ${role.displayName} Permissions</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <ul class="list-group">
                    ${permissionsList}
                  </ul>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
              </div>
            </div>
          </div>
        `;

        this.removeModal("viewPermissionsModal");
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        const modal = new bootstrap.Modal(
          document.getElementById("viewPermissionsModal")
        );
        modal.show();
      }
    } catch (error) {
      this.showError("Failed to load permissions: " + error.message);
    }
  }

  async editRole(roleId) {
    try {
      this.removeModal("viewRoleModal");
      const result = await API.request(`/roles/${roleId}`);
      if (result.success) {
        this.showEditModal(result.data);
      }
    } catch (error) {
      this.showError("Failed to load role: " + error.message);
    }
  }

  showEditModal(role) {
    const modalHtml = `
      <div class="modal fade" id="editRoleModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-warning text-white">
              <h5 class="modal-title"><i class="bi bi-pencil-square"></i> Edit Role</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form id="editRoleForm">
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Role Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="editName" value="${
                      role.name
                    }" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Display Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="editDisplayName" value="${
                      role.displayName
                    }" required>
                  </div>
                  <div class="col-12 mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="editDescription" rows="2">${
                      role.description || ""
                    }</textarea>
                  </div>
                </div>
                
                <div class="alert alert-info">
                  <i class="bi bi-info-circle"></i> Use the "Manage Permissions" button to update role permissions.
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle"></i> Cancel
                </button>
                <button type="button" class="btn btn-info" onclick="roleManager.managePermissions('${
                  role.id
                }')">
                  <i class="bi bi-key-fill"></i> Manage Permissions
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

    this.removeModal("editRoleModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(document.getElementById("editRoleModal"));
    modal.show();

    document.getElementById("editRoleForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateRole(role.id);
    });
  }

  async updateRole(roleId) {
    const submitBtn = document.querySelector(
      "#editRoleForm button[type='submit']"
    );
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Saving...';

    try {
      const data = {
        name: document.getElementById("editName").value,
        displayName: document.getElementById("editDisplayName").value,
        description: document.getElementById("editDescription").value || null,
      };

      const result = await API.request(`/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result.success) {
        this.showSuccess("Role updated successfully!");
        this.removeModal("editRoleModal");
        this.loadRoles();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to update role: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Changes';
    }
  }

  async managePermissions(roleId) {
    try {
      this.removeModal("editRoleModal");
      const result = await API.request(
        `/roles/${roleId}?includePermissions=true`
      );
      if (result.success) {
        this.showManagePermissionsModal(result.data);
      }
    } catch (error) {
      this.showError("Failed to load role: " + error.message);
    }
  }

  showManagePermissionsModal(role) {
    this.selectedPermissions = role.permissions || [];

    const modalHtml = `
      <div class="modal fade" id="managePermissionsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-info text-white">
              <h5 class="modal-title"><i class="bi bi-key-fill"></i> Manage Permissions - ${
                role.displayName
              }</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="input-group mb-3">
                <input type="text" class="form-control" id="managePermissionSearch" placeholder="Search permissions...">
                <button type="button" class="btn btn-outline-secondary" onclick="roleManager.clearManagePermissionSearch()">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              
              <div class="permission-list border rounded p-3" id="managePermissionList">
                ${this.renderManagePermissionList(role.permissions)}
              </div>
              
              <div class="mt-3">
                <small class="text-muted">Selected: <span id="manageSelectedCount">${
                  this.selectedPermissions.length
                }</span> permissions</small>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> Cancel
              </button>
              <button type="button" class="btn btn-primary" onclick="roleManager.savePermissions('${
                role.id
              }')">
                <i class="bi bi-check-circle"></i> Save Permissions
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.removeModal("managePermissionsModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(
      document.getElementById("managePermissionsModal")
    );
    modal.show();

    document
      .getElementById("managePermissionSearch")
      .addEventListener("input", (e) => {
        this.filterManagePermissionList(e.target.value);
      });
  }

  renderManagePermissionList(currentPermissions = []) {
    return this.allPermissions
      .map((perm) => {
        const isChecked = currentPermissions.includes(perm.name);
        return `
        <div class="form-check mb-2">
          <input class="form-check-input manage-permission-checkbox" type="checkbox" 
                 value="${perm.name}" id="manage_perm_${perm.id}"
                 ${isChecked ? "checked" : ""}
                 onchange="roleManager.toggleManagePermission('${perm.name}')">
          <label class="form-check-label" for="manage_perm_${perm.id}">
            <strong>${perm.name}</strong>
            <br><small class="text-muted">${
              perm.description || "No description"
            }</small>
          </label>
        </div>
      `;
      })
      .join("");
  }

  toggleManagePermission(permName) {
    const index = this.selectedPermissions.indexOf(permName);
    if (index > -1) {
      this.selectedPermissions.splice(index, 1);
    } else {
      this.selectedPermissions.push(permName);
    }

    const countEl = document.getElementById("manageSelectedCount");
    if (countEl) {
      countEl.textContent = this.selectedPermissions.length;
    }
  }

  filterManagePermissionList(search) {
    const checkboxes = document.querySelectorAll(".manage-permission-checkbox");
    checkboxes.forEach((cb) => {
      const label = cb.nextElementSibling;
      const text = label.textContent.toLowerCase();
      const parent = cb.parentElement;

      if (text.includes(search.toLowerCase())) {
        parent.style.display = "block";
      } else {
        parent.style.display = "none";
      }
    });
  }

  clearManagePermissionSearch() {
    const searchInput = document.getElementById("managePermissionSearch");
    if (searchInput) {
      searchInput.value = "";
      this.filterManagePermissionList("");
    }
  }

  async savePermissions(roleId) {
    const submitBtn = document.querySelector(
      "#managePermissionsModal button.btn-primary"
    );
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Saving...';

    try {
      const data = {
        permissions: this.selectedPermissions,
      };

      const result = await API.request(`/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result.success) {
        this.showSuccess("Permissions updated successfully!");
        this.removeModal("managePermissionsModal");
        this.loadRoles();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to update permissions: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="bi bi-check-circle"></i> Save Permissions';
    }
  }

  confirmDelete(roleId, roleName) {
    const modalHtml = `
      <div class="modal fade" id="deleteRoleModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="bi bi-exclamation-triangle"></i> Confirm Delete</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete the role <strong>${roleName}</strong>?</p>
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> This action cannot be undone!
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> Cancel
              </button>
              <button type="button" class="btn btn-danger" onclick="roleManager.deleteRole('${roleId}')">
                <i class="bi bi-trash"></i> Delete Role
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.removeModal("deleteRoleModal");
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(
      document.getElementById("deleteRoleModal")
    );
    modal.show();
  }

  async deleteRole(roleId) {
    const submitBtn = document.querySelector(
      "#deleteRoleModal button.btn-danger"
    );
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Deleting...';

    try {
      const result = await API.request(`/roles/${roleId}`, {
        method: "DELETE",
      });

      if (result.success) {
        this.showSuccess("Role deleted successfully!");
        this.removeModal("deleteRoleModal");
        this.loadRoles();
        this.loadStatistics();
      }
    } catch (error) {
      this.showError("Failed to delete role: " + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-trash"></i> Delete Role';
    }
  }

  removeModal(modalId) {
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      const modal = bootstrap.Modal.getInstance(existingModal);
      if (modal) modal.dispose();
      existingModal.remove();
    }
    document
      .querySelectorAll(".modal-backdrop")
      .forEach((backdrop) => backdrop.remove());
  }

  showSuccess(message) {
    this.showToast(message, "success");
  }

  showError(message) {
    this.showToast(message, "danger");
  }

  showToast(message, type = "info") {
    const toastId = "toast_" + Date.now();
    const toastHtml = `
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11000">
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
          <div class="d-flex">
            <div class="toast-body">
              <i class="bi ${
                type === "success" ? "bi-check-circle" : "bi-exclamation-circle"
              }"></i>
              ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", toastHtml);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener("hidden.bs.toast", () => {
      toastEl.parentElement.remove();
    });
  }
}

// Initialize
const roleManager = new RoleManager();
document.addEventListener("DOMContentLoaded", () => {
  roleManager.init();
});

// Logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    window.location.href = "/login.html";
  }
}
