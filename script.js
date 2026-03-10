// ==================== Phase 4: Data Persistence with localStorage ====================
const STORAGE_KEY = "ipt_demo_v1";
const LS_UNVERIFIED_EMAIL = "unverified_email";
const LS_AUTH_TOKEN = "auth_token";

let currentUser = null;
const FORCE_RESET_STORAGE = false;

// Save to localStorage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// Load from localStorage
function loadFromStorage() {
  try {
    if (FORCE_RESET_STORAGE) localStorage.removeItem(STORAGE_KEY);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("missing");

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("corrupt");

    // Validate data structure
    if (!Array.isArray(parsed.accounts)) throw new Error("corrupt accounts");
    if (!Array.isArray(parsed.departments)) throw new Error("corrupt departments");
    if (!Array.isArray(parsed.employees)) parsed.employees = [];
    if (!Array.isArray(parsed.requests)) parsed.requests = [];

    window.db = parsed;
  } catch (e) {
    // Seed default data if loading fails
    window.db = {
      accounts: [
        {
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          password: "Password123!",
          role: "Admin",
          verified: true
        }
      ],
      departments: [
        { id: uid(), name: "Engineering", description: "Software development team" },
        { id: uid(), name: "Human Resources", description: "HR department" },
        { id: uid(), name: "Marketing", description: "Marketing and communications" }
      ],
      employees: [],
      requests: []
    };
    saveToStorage();
  }
}

// ==================== Phase 8: Toast Notifications ====================
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;
  
  const toastId = 'toast-' + Date.now();
  
  const bgColor = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-info text-white'
  }[type] || 'bg-secondary text-white';
  
  const icon = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  }[type] || 'bi-bell-fill';
  
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center border-0 ${bgColor}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: duration, animation: true });
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// ==================== Phase 8: Loading States ====================
function setLoading(selector, isLoading, loadingText = 'Loading...') {
  const element = document.querySelector(selector);
  if (!element) return;
  
  if (isLoading) {
    element.dataset.originalText = element.innerHTML;
    element.disabled = true;
    element.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${loadingText}`;
  } else {
    element.innerHTML = element.dataset.originalText || element.innerHTML;
    element.disabled = false;
  }
}

// ==================== Phase 8: Form Validation ====================
function validateForm(formId, rules) {
  const errors = [];
  const form = document.getElementById(formId);
  if (!form) return errors;
  
  for (const [fieldId, rule] of Object.entries(rules)) {
    const field = document.getElementById(fieldId);
    if (!field) continue;
    
    const value = field.value.trim();
    field.classList.remove('is-invalid', 'is-valid');
    
    if (rule.required && !value) {
      errors.push(`${rule.label || fieldId} is required`);
      field.classList.add('is-invalid');
    } else if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${rule.label || fieldId} must be at least ${rule.minLength} characters`);
      field.classList.add('is-invalid');
    } else if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${rule.label || fieldId} is invalid`);
      field.classList.add('is-invalid');
    } else if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${rule.label || fieldId} must be a valid email`);
      field.classList.add('is-invalid');
    } else if (value) {
      field.classList.add('is-valid');
    }
  }
  
  return errors;
}

// ==================== Phase 2: Helpers ====================
function uid() {
  return Math.random().toString(36).substr(2, 9);
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function fmtDate(d) {
  try {
    const x = new Date(d);
    return isNaN(x.getTime()) ? "-" : x.toLocaleDateString();
  } catch {
    return "-";
  }
}

// ==================== Phase 2: UI Page switching ====================
function hideAllPages() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
}

function showPage(pageId) {
  const el = document.getElementById(pageId);
  if (el) el.classList.add("active");
}

// ==================== Phase 3 & 5: Auth State & Profile ====================
function setAuthState(isAuth, user = null) {
  const body = document.body;
  body.classList.remove("authenticated", "not-authenticated", "is-admin");

  if (!isAuth || !user) {
    currentUser = null;
    body.classList.add("not-authenticated");
    const navUsername = document.getElementById("navUsername");
    if (navUsername) navUsername.textContent = "User";
    
    const profName = document.getElementById("profName");
    const profEmail = document.getElementById("profEmail");
    const profRole = document.getElementById("profRole");
    
    if (profName) profName.textContent = "---";
    if (profEmail) profEmail.textContent = "---";
    if (profRole) profRole.textContent = "---";
    return;
  }

  currentUser = user;

  body.classList.add("authenticated");
  if (user.role === "Admin") body.classList.add("is-admin");

  const navUsername = document.getElementById("navUsername");
  if (navUsername) navUsername.textContent = user.firstName || user.email || "User";

  renderProfile();
}

function renderProfile() {
  if (!currentUser) return;
  
  const profName = document.getElementById("profName");
  const profEmail = document.getElementById("profEmail");
  const profRole = document.getElementById("profRole");
  
  if (profName) {
    const fullName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
    profName.textContent = fullName || currentUser.email || "Unknown User";
  }
  if (profEmail) profEmail.textContent = currentUser.email || "(no email)";
  if (profRole) profRole.textContent = currentUser.role || "User";
}

function restoreAuthFromToken() {
  const tokenEmail = normalizeEmail(localStorage.getItem(LS_AUTH_TOKEN));
  if (!tokenEmail) {
    setAuthState(false);
    return;
  }

  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === tokenEmail);
  if (!acc) {
    localStorage.removeItem(LS_AUTH_TOKEN);
    setAuthState(false);
    return;
  }

  setAuthState(true, acc);
}

// ==================== Phase 2: Routing ====================
function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  restoreAuthFromToken();

  let hash = window.location.hash;

  if (!hash || hash === "#") {
    navigateTo("#/home");
    return;
  }

  if (hash.startsWith("#") && !hash.startsWith("#/")) {
    navigateTo("#/" + hash.substring(1));
    return;
  }

  const routes = {
    "#/": "page-home",
    "#/home": "page-home",
    "#/register": "page-register",
    "#/verify-email": "page-verify-email",
    "#/login": "page-login",
    "#/profile": "page-profile",
    "#/employees": "page-employees",
    "#/accounts": "page-accounts",
    "#/departments": "page-departments",
    "#/admin-requests": "page-admin-requests",
    "#/requests": "page-requests"
  };

  const protectedRoutes = new Set([
    "#/profile",
    "#/employees",
    "#/accounts",
    "#/departments",
    "#/admin-requests",
    "#/requests"
  ]);

  const adminRoutes = new Set([
    "#/employees",
    "#/accounts",
    "#/departments",
    "#/admin-requests"
  ]);

  if (protectedRoutes.has(hash) && !currentUser) {
    showToast("Please login to access this page", "warning");
    navigateTo("#/login");
    return;
  }

  if (adminRoutes.has(hash) && currentUser?.role !== "Admin") {
    showToast("Admin access required", "error");
    navigateTo("#/profile");
    return;
  }

  hideAllPages();
  showPage(routes[hash] || "page-home");

  if (hash === "#/verify-email") {
    const pendingEmail = localStorage.getItem(LS_UNVERIFIED_EMAIL) || "---";
    const verifySpan = document.getElementById("verifyEmailText");
    if (verifySpan) verifySpan.textContent = pendingEmail;
  }

  if (hash === "#/profile" && currentUser) {
    renderProfile();
  }

  renderAll();
}

// ==================== Phase 6 & 7: Render functions ====================
function renderAll() {
  renderDepartments();
  renderEmployees();
  renderAccounts();
  renderRequests();
  if (currentUser?.role === 'Admin') {
    renderAdminRequests();
  }
  fillEmployeeDeptOptions();
  fillUserOptions();
}

function fillEmployeeDeptOptions() {
  const sel = document.getElementById("empDept");
  if (!sel) return;

  sel.innerHTML = "";
  window.db.departments.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.name;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

function fillUserOptions() {
  const sel = document.getElementById("empUserEmail");
  if (!sel) return;

  sel.innerHTML = '<option value="">Select a user...</option>';
  
  const availableUsers = window.db.accounts.filter(acc => acc.verified);

  availableUsers.forEach(user => {
    const opt = document.createElement("option");
    opt.value = user.email;
    opt.textContent = `${user.firstName || ''} ${user.lastName || ''} (${user.email})`.trim();
    sel.appendChild(opt);
  });
}

// ==================== Phase 6: Departments CRUD ====================
function renderDepartments() {
  const tb = document.getElementById("tblDepartments");
  if (!tb) return;

  tb.innerHTML = "";

  window.db.departments.forEach(dep => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${dep.name}</strong></td>
      <td>${dep.description || '<em class="text-muted">No description</em>'}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" title="Edit department">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="del" title="Delete department">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;

    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openDepartmentEdit(dep.id));
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteDepartment(dep.id));

    tb.appendChild(tr);
  });
}

function openDepartmentEdit(id) {
  const dep = window.db.departments.find(d => d.id === id);
  if (!dep) return;

  document.getElementById("deptId").value = dep.id;
  document.getElementById("deptName").value = dep.name;
  document.getElementById("deptDesc").value = dep.description || "";

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDepartment"));
  modal.show();
}

function deleteDepartment(id) {
  const dep = window.db.departments.find(d => d.id === id);
  if (!dep) return;

  const usedByEmployees = window.db.employees.some(e => e.department === dep.name);
  if (usedByEmployees) {
    if (!confirm(`⚠️ Warning: This department is assigned to employees. Deleting it may affect those records. Continue?`)) {
      return;
    }
  }

  if (!confirm(`Delete department "${dep.name}"?`)) return;

  window.db.departments = window.db.departments.filter(d => d.id !== id);
  saveToStorage();
  renderAll();
  showToast(`Department "${dep.name}" deleted successfully`, "success");
}

// ==================== Phase 6: Employees CRUD ====================
function renderEmployees() {
  const tb = document.getElementById("tblEmployees");
  if (!tb) return;

  tb.innerHTML = "";

  window.db.employees.forEach(emp => {
    const userAccount = window.db.accounts.find(a => 
      normalizeEmail(a.email) === normalizeEmail(emp.userEmail)
    );
    
    const userEmail = userAccount ? emp.userEmail : '<span class="text-danger">No linked account</span>';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${emp.id}</code></td>
      <td>${userEmail}</td>
      <td>${emp.position}</td>
      <td><span class="badge bg-secondary">${emp.department}</span></td>
      <td>${fmtDate(emp.hireDate)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" title="Edit employee">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="del" title="Delete employee">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;

    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openEmployeeEdit(emp.id));
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteEmployee(emp.id));

    tb.appendChild(tr);
  });
}

function openEmployeeEdit(id) {
  const emp = window.db.employees.find(x => x.id === id);
  if (!emp) return;

  document.getElementById("empId").value = emp.id;
  document.getElementById("empUserEmail").value = emp.userEmail || '';
  document.getElementById("empPos").value = emp.position;
  document.getElementById("empDept").value = emp.department;
  document.getElementById("empHire").value = emp.hireDate;

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEmployee"));
  modal.show();
}

function deleteEmployee(id) {
  if (!confirm("Delete this employee record?")) return;

  window.db.employees = window.db.employees.filter(e => e.id !== id);
  saveToStorage();
  renderAll();
  showToast("Employee deleted successfully", "success");
}

// ==================== Phase 6: Accounts CRUD ====================
function renderAccounts() {
  const tb = document.getElementById("tblAccounts");
  if (!tb) return;

  tb.innerHTML = "";

  window.db.accounts.forEach(acc => {
    const tr = document.createElement("tr");
    const fullName = `${acc.firstName || ""} ${acc.lastName || ""}`.trim() || "(no name)";
    tr.innerHTML = `
      <td>${fullName}</td>
      <td>${acc.email}</td>
      <td><span class="badge ${acc.role === 'Admin' ? 'bg-danger' : 'bg-info'}">${acc.role}</span></td>
      <td>${acc.verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-warning">Unverified</span>'}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" title="Edit account">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-warning me-1" data-action="reset" title="Reset password">
          <i class="bi bi-key"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="del" title="Delete account">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;

    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openAccountEdit(acc.email));
    tr.querySelector('[data-action="reset"]').addEventListener("click", () => resetPassword(acc.email));
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteAccount(acc.email));

    tb.appendChild(tr);
  });
}

function openAccountEdit(email) {
  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === normalizeEmail(email));
  if (!acc) return;

  document.getElementById("accFirst").value = acc.firstName || '';
  document.getElementById("accLast").value = acc.lastName || '';
  document.getElementById("accEmail").value = acc.email;
  document.getElementById("accPass").value = acc.password;
  document.getElementById("accRole").value = acc.role;
  document.getElementById("accVerified").checked = acc.verified || false;

  document.getElementById("modalAccount").dataset.editingEmail = acc.email;

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAccount"));
  modal.show();
}

function resetPassword(email) {
  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === normalizeEmail(email));
  if (!acc) return;

  const newPass = prompt("Enter new password (min 6 chars):");
  if (!newPass) return;
  if (newPass.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }
  if (!confirm("Are you sure you want to reset this password?")) return;

  acc.password = newPass;
  saveToStorage();
  renderAll();
  showToast("Password reset successfully!", "success");
}

function deleteAccount(email) {
  const target = normalizeEmail(email);

  if (normalizeEmail(currentUser?.email) === target) {
    showToast("You cannot delete your own account", "error");
    return;
  }

  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === target);
  if (!acc) return;

  if (!confirm(`Delete account for ${acc.firstName || ''} ${acc.lastName || ''}?`)) return;

  window.db.accounts = window.db.accounts.filter(a => normalizeEmail(a.email) !== target);
  saveToStorage();
  renderAll();
  showToast("Account deleted successfully!", "success");
}

// ==================== Profile Editing ====================
function openEditProfile() {
  if (!currentUser) return;
  
  document.getElementById("editFirstName").value = currentUser.firstName || '';
  document.getElementById("editLastName").value = currentUser.lastName || '';
  document.getElementById("editEmail").value = currentUser.email || '';
  document.getElementById("editCurrentPass").value = '';
  document.getElementById("editNewPass").value = '';
  document.getElementById("editConfirmPass").value = '';
  
  const modal = new bootstrap.Modal(document.getElementById("modalEditProfile"));
  modal.show();
}

// ==================== Phase 7: User Requests ====================
function renderRequests() {
  const wrap = document.getElementById("reqTableWrap");
  const empty = document.getElementById("reqEmpty");
  const tb = document.getElementById("tblRequests");
  if (!wrap || !empty || !tb) return;

  tb.innerHTML = "";

  const myEmail = currentUser ? normalizeEmail(currentUser.email) : "";
  const myRequests = window.db.requests.filter(r => normalizeEmail(r.ownerEmail) === myEmail);

  if (myRequests.length === 0) {
    empty.classList.remove("d-none");
    wrap.classList.add("d-none");
    return;
  }

  empty.classList.add("d-none");
  wrap.classList.remove("d-none");

  myRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  myRequests.forEach(r => {
    const itemsList = (r.items || []).map(it => 
      `<span class="badge bg-secondary me-1">${it.name} (${it.qty})</span>`
    ).join('');
    
    let statusClass = 'bg-warning text-dark';
    if (r.status === 'Approved') statusClass = 'bg-success';
    if (r.status === 'Rejected') statusClass = 'bg-danger';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${r.id}</code></td>
      <td><span class="badge bg-info">${r.type}</span></td>
      <td>${itemsList}</td>
      <td>${fmtDate(r.createdAt)}</td>
      <td>
        <span class="badge ${statusClass}">${r.status || 'Pending'}</span>
      </td>
      <td class="text-end">
        ${r.status === 'Pending' ? 
          '<button class="btn btn-sm btn-outline-danger" data-action="del" title="Cancel request"><i class="bi bi-x-lg"></i></button>' : 
          '<button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-lock"></i></button>'}
      </td>
    `;
    
    if (r.status === 'Pending') {
      tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteRequest(r.id));
    }
    
    tb.appendChild(tr);
  });
}

function addRequestItemRow(itemName = '', quantity = 1) {
  const container = document.getElementById("reqItems");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "request-item d-flex gap-2 align-items-center mb-2";

  row.innerHTML = `
    <input class="form-control form-control-sm" placeholder="Item name (e.g., Laptop)" value="${itemName}" required />
    <input class="form-control form-control-sm" type="number" min="1" value="${quantity}" style="max-width:90px;" required />
    <button class="btn btn-outline-danger btn-sm remove-item" type="button">
      <i class="bi bi-x-lg"></i>
    </button>
  `;

  row.querySelector(".remove-item").addEventListener("click", () => {
    if (container.children.length > 1) {
      row.remove();
    } else {
      showToast("You need at least one item", "warning");
    }
  });
  
  container.appendChild(row);
}

function deleteRequest(id) {
  const request = window.db.requests.find(r => r.id === id);
  if (!request) return;
  
  if (request.status !== 'Pending') {
    showToast("Only pending requests can be cancelled", "error");
    return;
  }
  
  if (!confirm("Cancel this request?")) return;

  window.db.requests = window.db.requests.filter(r => r.id !== id);
  saveToStorage();
  renderAll();
  showToast("Request cancelled", "success");
}

// ==================== Admin Requests Dashboard ====================
function renderAdminRequests() {
  if (!currentUser || currentUser.role !== 'Admin') return;
  
  const allRequests = window.db.requests || [];
  
  document.getElementById('pendingCount').textContent = allRequests.filter(r => r.status === 'Pending').length;
  document.getElementById('approvedCount').textContent = allRequests.filter(r => r.status === 'Approved').length;
  document.getElementById('rejectedCount').textContent = allRequests.filter(r => r.status === 'Rejected').length;
  document.getElementById('allCount').textContent = allRequests.length;
  
  renderRequestTable('tblPendingRequests', allRequests.filter(r => r.status === 'Pending'));
  renderRequestTable('tblApprovedRequests', allRequests.filter(r => r.status === 'Approved'));
  renderRequestTable('tblRejectedRequests', allRequests.filter(r => r.status === 'Rejected'));
  renderRequestTable('tblAllRequests', allRequests);
}

function renderRequestTable(tableId, requests) {
  const tb = document.getElementById(tableId);
  if (!tb) return;
  
  tb.innerHTML = "";
  
  if (requests.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No requests found</td></tr>';
    return;
  }
  
  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  requests.forEach(r => {
    const user = window.db.accounts.find(a => 
      normalizeEmail(a.email) === normalizeEmail(r.ownerEmail)
    );
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : r.ownerEmail;
    
    const itemsList = (r.items || []).map(it => 
      `<span class="badge bg-secondary me-1">${it.name} (${it.qty})</span>`
    ).join('');
    
    let statusClass = 'bg-warning text-dark';
    if (r.status === 'Approved') statusClass = 'bg-success';
    if (r.status === 'Rejected') statusClass = 'bg-danger';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${r.id}</code></td>
      <td>${userName}<br><small class="text-muted">${r.ownerEmail}</small></td>
      <td><span class="badge bg-info">${r.type}</span></td>
      <td>${itemsList}</td>
      <td>${fmtDate(r.createdAt)}</td>
      <td>
        <span class="badge ${statusClass}">${r.status || 'Pending'}</span>
      </td>
      <td class="text-end">
        ${r.status === 'Pending' ? 
          `<button class="btn btn-sm btn-success me-1" data-action="approve" data-id="${r.id}" title="Approve">
              <i class="bi bi-check-lg"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-action="reject" data-id="${r.id}" title="Reject">
              <i class="bi bi-x-lg"></i>
            </button>` : 
          `<button class="btn btn-sm btn-outline-secondary" disabled>
              <i class="bi bi-lock"></i>
            </button>`}
      </td>
    `;
    
    if (r.status === 'Pending') {
      tr.querySelector('[data-action="approve"]').addEventListener("click", () => updateRequestStatus(r.id, 'Approved'));
      tr.querySelector('[data-action="reject"]').addEventListener("click", () => updateRequestStatus(r.id, 'Rejected'));
    }
    
    tb.appendChild(tr);
  });
}

function updateRequestStatus(requestId, newStatus) {
  if (!currentUser || currentUser.role !== 'Admin') {
    showToast("Admin access required", "error");
    return;
  }
  
  const request = window.db.requests.find(r => r.id === requestId);
  if (!request) return;
  
  request.status = newStatus;
  request.updatedAt = new Date().toISOString();
  request.updatedBy = currentUser.email;
  
  saveToStorage();
  
  renderAdminRequests();
  renderRequests();
  
  showToast(`Request ${newStatus.toLowerCase()} successfully!`, "success");
}

// ==================== Event Handlers ====================

// Register
document.getElementById("formRegister")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const errors = validateForm('formRegister', {
    'regFirst': { required: true, label: 'First name' },
    'regLast': { required: true, label: 'Last name' },
    'regEmail': { required: true, email: true, label: 'Email' },
    'regPassword': { required: true, minLength: 6, label: 'Password' }
  });

  if (errors.length > 0) {
    showToast(errors.join('<br>'), 'error');
    return;
  }

  const firstName = document.getElementById("regFirst").value.trim();
  const lastName = document.getElementById("regLast").value.trim();
  const email = normalizeEmail(document.getElementById("regEmail").value);
  const password = document.getElementById("regPassword").value;

  setLoading('#formRegister button[type="submit"]', true, 'Creating account...');

  setTimeout(() => {
    const exists = window.db.accounts.some(a => normalizeEmail(a.email) === email);
    if (exists) {
      setLoading('#formRegister button[type="submit"]', false);
      showToast("Email already exists", "error");
      return;
    }

    window.db.accounts.push({
      firstName,
      lastName,
      email,
      password,
      role: "User",
      verified: false
    });

    saveToStorage();
    setLoading('#formRegister button[type="submit"]', false);
    
    localStorage.setItem(LS_UNVERIFIED_EMAIL, email);
    showToast("Account created! Please verify your email.", "success");
    navigateTo("#/verify-email");
  }, 1000);
});

// Verify Email
document.getElementById("btnSimulateVerify")?.addEventListener("click", () => {
  const email = normalizeEmail(localStorage.getItem(LS_UNVERIFIED_EMAIL));
  if (!email) {
    showToast("No pending verification found", "error");
    return;
  }

  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === email);
  if (!acc) {
    showToast("Account not found", "error");
    return;
  }

  acc.verified = true;
  saveToStorage();

  localStorage.removeItem(LS_UNVERIFIED_EMAIL);

  document.getElementById("verifiedDone")?.classList.remove("d-none");
  showToast("Email verified successfully!", "success");
  navigateTo("#/login");
});

// Login
document.getElementById("formLogin")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const errors = validateForm('formLogin', {
    'loginId': { required: true, email: true, label: 'Email' },
    'loginPassword': { required: true, minLength: 6, label: 'Password' }
  });

  if (errors.length > 0) {
    showToast(errors.join('<br>'), 'error');
    return;
  }

  const email = normalizeEmail(document.getElementById("loginId").value);
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");

  err.classList.add("d-none");
  err.textContent = "";

  setLoading('#formLogin button[type="submit"]', true, 'Logging in...');

  setTimeout(() => {
    const acc = window.db.accounts.find(a =>
      normalizeEmail(a.email) === email &&
      a.password === password &&
      a.verified === true
    );

    setLoading('#formLogin button[type="submit"]', false);

    if (!acc) {
      err.textContent = "Invalid email/password OR email not verified.";
      err.classList.remove("d-none");
      showToast("Login failed", "error");
      return;
    }

    localStorage.setItem(LS_AUTH_TOKEN, acc.email);
    setAuthState(true, acc);
    showToast(`Welcome, ${acc.firstName || acc.email}!`, "success");
    navigateTo("#/profile");
  }, 1000);
});

// Logout
document.getElementById("menuLogout")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem(LS_AUTH_TOKEN);
  setAuthState(false);
  showToast("Logged out successfully", "info");
  navigateTo("#/home");
});

// Edit Profile Button
document.getElementById("btnEditProfile")?.addEventListener("click", (e) => {
  e.preventDefault();
  openEditProfile();
});

// Profile Edit Form
document.getElementById("formEditProfile")?.addEventListener("submit", (e) => {
  e.preventDefault();
  
  if (!currentUser) return;
  
  const firstName = document.getElementById("editFirstName").value.trim();
  const lastName = document.getElementById("editLastName").value.trim();
  const currentPass = document.getElementById("editCurrentPass").value;
  const newPass = document.getElementById("editNewPass").value;
  const confirmPass = document.getElementById("editConfirmPass").value;
  
  if (currentPass !== currentUser.password) {
    showToast("Current password is incorrect", "error");
    return;
  }
  
  if (newPass || confirmPass) {
    if (newPass.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPass !== confirmPass) {
      showToast("New passwords do not match", "error");
      return;
    }
  }
  
  const userIndex = window.db.accounts.findIndex(a => 
    normalizeEmail(a.email) === normalizeEmail(currentUser.email)
  );
  
  if (userIndex !== -1) {
    window.db.accounts[userIndex].firstName = firstName;
    window.db.accounts[userIndex].lastName = lastName;
    
    if (newPass) {
      window.db.accounts[userIndex].password = newPass;
    }
    
    currentUser = window.db.accounts[userIndex];
    
    saveToStorage();
    
    setAuthState(true, currentUser);
    
    showToast("Profile updated successfully!", "success");
    
    bootstrap.Modal.getInstance(document.getElementById("modalEditProfile"))?.hide();
  }
});

// Department Form
document.getElementById("formAddDepartment")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("deptId").value.trim();
  const name = document.getElementById("deptName").value.trim();
  const desc = document.getElementById("deptDesc").value.trim();

  if (!name) {
    showToast("Department name is required", "error");
    return;
  }

  if (id) {
    const dep = window.db.departments.find(d => d.id === id);
    if (dep) {
      dep.name = name;
      dep.description = desc;
      showToast("Department updated successfully", "success");
    }
  } else {
    window.db.departments.push({ id: uid(), name, description: desc });
    showToast("Department added successfully", "success");
  }

  saveToStorage();
  renderAll();

  document.getElementById("deptId").value = "";
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("modalDepartment"))?.hide();
});

// Employee Form
document.getElementById("formAddEmployee")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("empId").value.trim();
  const userEmail = normalizeEmail(document.getElementById("empUserEmail").value);
  const position = document.getElementById("empPos").value.trim();
  const department = document.getElementById("empDept").value;
  const hireDate = document.getElementById("empHire").value;

  const userAccount = window.db.accounts.find(a => 
    normalizeEmail(a.email) === userEmail && a.verified
  );
  
  if (!userAccount) {
    showToast("Selected user account not found or not verified", "error");
    return;
  }

  if (id) {
    const emp = window.db.employees.find(x => x.id === id);
    if (emp) {
      const isUserAlreadyLinked = window.db.employees.some(e => 
        e.id !== id && normalizeEmail(e.userEmail) === userEmail
      );
      
      if (isUserAlreadyLinked) {
        showToast("This user is already linked to another employee", "error");
        return;
      }
      
      emp.userEmail = userEmail;
      emp.position = position;
      emp.department = department;
      emp.hireDate = hireDate;
      showToast("Employee updated successfully", "success");
    }
  } else {
    if (window.db.employees.some(e => normalizeEmail(e.userEmail) === userEmail)) {
      showToast("This user is already linked to an employee", "error");
      return;
    }
    
    window.db.employees.push({
      id: uid(),
      userEmail,
      position,
      department,
      hireDate
    });
    showToast("Employee added successfully", "success");
  }

  saveToStorage();
  renderAll();

  document.getElementById("empId").value = "";
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("modalEmployee"))?.hide();
});

// Account Form
document.getElementById("formAddAccount")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("accFirst").value.trim();
  const lastName = document.getElementById("accLast").value.trim();
  const email = normalizeEmail(document.getElementById("accEmail").value);
  const password = document.getElementById("accPass").value;
  const role = document.getElementById("accRole").value;
  const verified = document.getElementById("accVerified").checked;
  
  const editingEmail = document.getElementById("modalAccount").dataset.editingEmail;

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  if (editingEmail) {
    const acc = window.db.accounts.find(a => normalizeEmail(a.email) === normalizeEmail(editingEmail));
    if (acc) {
      if (email !== normalizeEmail(editingEmail) && 
          window.db.accounts.some(a => normalizeEmail(a.email) === email)) {
        showToast("Email already exists", "error");
        return;
      }
      
      acc.firstName = firstName;
      acc.lastName = lastName;
      acc.email = email;
      acc.password = password;
      acc.role = role;
      acc.verified = verified;
      showToast("Account updated successfully", "success");
    }
  } else {
    if (window.db.accounts.some(a => normalizeEmail(a.email) === email)) {
      showToast("Email already exists", "error");
      return;
    }

    window.db.accounts.push({
      firstName,
      lastName,
      email,
      password,
      role,
      verified
    });
    showToast("Account added successfully", "success");
  }

  saveToStorage();
  renderAll();

  e.target.reset();
  delete document.getElementById("modalAccount").dataset.editingEmail;
  bootstrap.Modal.getInstance(document.getElementById("modalAccount"))?.hide();
});

// Request Form
document.getElementById("btnAddReqItem")?.addEventListener("click", () => {
  addRequestItemRow();
});

document.getElementById("modalNewRequest")?.addEventListener("shown.bs.modal", () => {
  const container = document.getElementById("reqItems");
  if (container) {
    container.innerHTML = '';
    addRequestItemRow();
  }
  document.getElementById("reqType").value = '';
});

document.getElementById("formNewRequest")?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) {
    showToast("Please login first", "error");
    return;
  }

  const type = document.getElementById("reqType").value;
  if (!type) {
    showToast("Please select a request type", "error");
    return;
  }

  const rows = Array.from(document.querySelectorAll("#reqItems > div"));
  
  const items = rows.map(r => {
    const inputs = r.querySelectorAll("input");
    const name = inputs[0]?.value.trim();
    const qty = parseInt(inputs[1]?.value);
    return { name, qty };
  }).filter(x => x.name && x.qty > 0);

  if (items.length === 0) {
    showToast("Please add at least one item", "error");
    return;
  }

  const invalidItems = items.filter(x => !x.name);
  if (invalidItems.length > 0) {
    showToast("Please fill in all item names", "error");
    return;
  }

  const newRequest = {
    id: uid(),
    ownerEmail: currentUser.email,
    type,
    items,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  window.db.requests.push(newRequest);
  saveToStorage();
  renderAll();

  showToast("Request submitted successfully! It will be reviewed by an admin.", "success");

  document.getElementById("reqType").value = "";
  document.getElementById("reqItems").innerHTML = "";
  bootstrap.Modal.getInstance(document.getElementById("modalNewRequest"))?.hide();
});

// ==================== Initialize ====================
loadFromStorage();
window.addEventListener("hashchange", handleRouting);
handleRouting();