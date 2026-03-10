const STORAGE_KEY = "ipt_demo_v2";

let db = {};
let tempVerifyEmail = null;

function seedDatabase() {
  return {
    users: [
      {
        id: crypto.randomUUID(),
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "Password123!",
        role: "Admin",
        verified: true
      }
    ],
    departments: [
      {
        id: crypto.randomUUID(),
        name: "Engineering",
        description: "Handles development and technical work"
      },
      {
        id: crypto.randomUUID(),
        name: "HR",
        description: "Handles people and employee management"
      }
    ],
    employees: [],
    requests: [],
    currentUserId: null
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      db = seedDatabase();
      saveToStorage();
      return;
    }

    db = JSON.parse(raw);

    if (!db.users || !db.departments || !db.employees || !db.requests) {
      db = seedDatabase();
      saveToStorage();
    }
  } catch (error) {
    db = seedDatabase();
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

function showToast(message, type = "success") {
  const container = $(".toast-container");
  const id = "toast-" + Date.now();

  const iconMap = {
    success: "bi-check-circle-fill",
    error: "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill"
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type} align-items-center`;
  toast.id = id;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${iconMap[type] || iconMap.success}"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 2500 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

function getCurrentUser() {
  return db.users.find(u => u.id === db.currentUserId) || null;
}

function updateAuthUI() {
  const user = getCurrentUser();
  const adminQuickCards = document.getElementById("adminQuickCards");
  const userQuickRequestCard = document.getElementById("userQuickRequestCard");

  if (user) {
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");
    $("#navUsername").textContent = `${user.firstName} ${user.lastName}`;

    if (user.role === "Admin") {
      document.body.classList.add("is-admin");
      if (adminQuickCards) adminQuickCards.style.display = "flex";
      if (userQuickRequestCard) userQuickRequestCard.style.display = "none";
    } else {
      document.body.classList.remove("is-admin");
      if (adminQuickCards) adminQuickCards.style.display = "none";
      if (userQuickRequestCard) userQuickRequestCard.style.display = "flex";
    }
  } else {
    document.body.classList.remove("authenticated", "is-admin");
    document.body.classList.add("not-authenticated");
    if (adminQuickCards) adminQuickCards.style.display = "none";
    if (userQuickRequestCard) userQuickRequestCard.style.display = "none";
  }
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function showPage(pageId) {
  $all(".page").forEach(page => page.classList.remove("active"));
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
}

function route() {
  const hash = window.location.hash || "#/home";
  const user = getCurrentUser();

  const pageMap = {
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

  let pageId = pageMap[hash] || "page-home";

  if ((hash === "#/profile" || hash === "#/requests") && !user) {
    pageId = "page-login";
    window.location.hash = "#/login";
  }

  if (
    (hash === "#/employees" ||
      hash === "#/accounts" ||
      hash === "#/departments" ||
      hash === "#/admin-requests") &&
    (!user || user.role !== "Admin")
  ) {
    pageId = user ? "page-profile" : "page-login";
    window.location.hash = user ? "#/profile" : "#/login";
  }

  showPage(pageId);
  updateAuthUI();
  renderAll();
}

function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;

  $("#profName").textContent = `${user.firstName} ${user.lastName}`;
  $("#profEmail").textContent = user.email;
  $("#profRole").textContent = user.role;

  const adminQuickCards = document.getElementById("adminQuickCards");
  const userQuickRequestCard = document.getElementById("userQuickRequestCard");

  if (user.role === "Admin") {
    if (adminQuickCards) adminQuickCards.style.display = "flex";
    if (userQuickRequestCard) userQuickRequestCard.style.display = "none";
  } else {
    if (adminQuickCards) adminQuickCards.style.display = "none";
    if (userQuickRequestCard) userQuickRequestCard.style.display = "flex";
  }
}

function renderAccounts() {
  const container = $("#accountsCards");
  const empty = $("#accountsEmpty");
  if (!container || !empty) return;

  container.innerHTML = "";

  if (db.users.length === 0) {
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");

  db.users.forEach(user => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <h5>${user.firstName} ${user.lastName}</h5>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Status:</strong> ${user.verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-warning text-dark">Unverified</span>'}</p>
    `;
    container.appendChild(card);
  });
}

function renderDepartments() {
  const container = $("#departmentsCards");
  const empty = $("#departmentsEmpty");
  if (!container || !empty) return;

  container.innerHTML = "";

  if (db.departments.length === 0) {
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");

  db.departments.forEach(dept => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <h5>${dept.name}</h5>
      <p><strong>Description:</strong> ${dept.description || "No description"}</p>
    `;
    container.appendChild(card);
  });
}

function renderEmployees() {
  const container = $("#employeesCards");
  const empty = $("#employeesEmpty");
  if (!container || !empty) return;

  container.innerHTML = "";

  if (db.employees.length === 0) {
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");

  db.employees.forEach(emp => {
    const user = db.users.find(u => u.email === emp.userEmail);
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <h5>${user ? user.firstName + " " + user.lastName : "Unknown User"}</h5>
      <p><strong>Email:</strong> ${emp.userEmail}</p>
      <p><strong>Position:</strong> ${emp.position}</p>
      <p><strong>Department:</strong> ${emp.department}</p>
      <p><strong>Hire Date:</strong> ${emp.hireDate}</p>
    `;
    container.appendChild(card);
  });
}

function requestStatusBadge(status) {
  if (status === "Approved") return `<span class="badge bg-success">Approved</span>`;
  if (status === "Rejected") return `<span class="badge bg-danger">Rejected</span>`;
  return `<span class="badge bg-warning text-dark">Pending</span>`;
}

function itemsToHTML(items) {
  return items.map(item => `${item.name} (x${item.qty})`).join(", ");
}

function renderUserRequests() {
  const container = $("#userRequestsCards");
  const empty = $("#reqEmpty");
  if (!container || !empty) return;

  const user = getCurrentUser();
  if (!user) return;

  const myRequests = db.requests.filter(r => r.userId === user.id);

  container.innerHTML = "";

  if (myRequests.length === 0) {
    empty.classList.remove("d-none");
    container.classList.add("d-none");
    return;
  }

  empty.classList.add("d-none");
  container.classList.remove("d-none");

  myRequests.forEach(req => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <h5>${req.type}</h5>
      <p><strong>Request ID:</strong> ${req.id}</p>
      <p><strong>Date:</strong> ${req.date}</p>
      <p><strong>Items:</strong> ${itemsToHTML(req.items)}</p>
      <p><strong>Status:</strong> ${requestStatusBadge(req.status)}</p>
    `;
    container.appendChild(card);
  });
}

function renderAdminRequests() {
  const pending = db.requests.filter(r => r.status === "Pending");
  const approved = db.requests.filter(r => r.status === "Approved");
  const rejected = db.requests.filter(r => r.status === "Rejected");
  const all = db.requests;

  $("#pendingCount").textContent = pending.length;
  $("#approvedCount").textContent = approved.length;
  $("#rejectedCount").textContent = rejected.length;
  $("#allCount").textContent = all.length;

  fillAdminRequestCards("#pendingRequestsCards", pending, true);
  fillAdminRequestCards("#approvedRequestsCards", approved, false);
  fillAdminRequestCards("#rejectedRequestsCards", rejected, false);
  fillAdminRequestCards("#allRequestsCards", all, false);
}

function fillAdminRequestCards(selector, requests, showActions) {
  const container = $(selector);
  if (!container) return;

  container.innerHTML = "";

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state w-100">
        <i class="bi bi-inbox"></i>
        <p>No requests found.</p>
      </div>
    `;
    return;
  }

  requests.forEach(req => {
    const user = db.users.find(u => u.id === req.userId);
    const card = document.createElement("div");
    card.className = "info-card";

    card.innerHTML = `
      <h5>${req.type}</h5>
      <p><strong>User:</strong> ${user ? user.firstName + " " + user.lastName : "Unknown User"}</p>
      <p><strong>Email:</strong> ${user ? user.email : "---"}</p>
      <p><strong>Date:</strong> ${req.date}</p>
      <p><strong>Items:</strong> ${itemsToHTML(req.items)}</p>
      <p><strong>Status:</strong> ${requestStatusBadge(req.status)}</p>
      ${
        showActions
          ? `
            <div class="actions">
              <button class="btn btn-success btn-sm" onclick="approveRequest('${req.id}')">Approve</button>
              <button class="btn btn-danger btn-sm" onclick="rejectRequest('${req.id}')">Reject</button>
            </div>
          `
          : ""
      }
    `;

    container.appendChild(card);
  });
}

function approveRequest(id) {
  const req = db.requests.find(r => r.id === id);
  if (!req) return;
  req.status = "Approved";
  saveToStorage();
  renderAll();
  showToast("Request approved", "success");
}

function rejectRequest(id) {
  const req = db.requests.find(r => r.id === id);
  if (!req) return;
  req.status = "Rejected";
  saveToStorage();
  renderAll();
  showToast("Request rejected", "warning");
}

function populateEmployeeDropdowns() {
  const userSelect = $("#empUserEmail");
  const deptSelect = $("#empDept");

  if (userSelect) {
    userSelect.innerHTML = `<option value="">Select a user...</option>`;
    db.users.forEach(user => {
      const option = document.createElement("option");
      option.value = user.email;
      option.textContent = `${user.firstName} ${user.lastName} - ${user.email}`;
      userSelect.appendChild(option);
    });
  }

  if (deptSelect) {
    deptSelect.innerHTML = `<option value="">Select department...</option>`;
    db.departments.forEach(dept => {
      const option = document.createElement("option");
      option.value = dept.name;
      option.textContent = dept.name;
      deptSelect.appendChild(option);
    });
  }
}

function addRequestItemRow(name = "", qty = 1) {
  const wrapper = document.createElement("div");
  wrapper.className = "request-item";
  wrapper.innerHTML = `
    <div class="row g-2 align-items-center">
      <div class="col-md-7">
        <input type="text" class="form-control req-item-name" placeholder="Item name" value="${name}" required>
      </div>
      <div class="col-md-3">
        <input type="number" class="form-control req-item-qty" placeholder="Qty" min="1" value="${qty}" required>
      </div>
      <div class="col-md-2 text-end">
        <button type="button" class="btn btn-outline-danger w-100 remove-item-btn">Remove</button>
      </div>
    </div>
  `;

  wrapper.querySelector(".remove-item-btn").addEventListener("click", () => wrapper.remove());
  $("#reqItems").appendChild(wrapper);
}

function clearRequestForm() {
  $("#reqType").value = "";
  $("#reqItems").innerHTML = "";
  addRequestItemRow();
}

function renderAll() {
  renderProfile();
  renderAccounts();
  renderDepartments();
  renderEmployees();
  renderUserRequests();
  renderAdminRequests();
  populateEmployeeDropdowns();
}

function handleRegister(e) {
  e.preventDefault();

  const firstName = $("#regFirst").value.trim();
  const lastName = $("#regLast").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const password = $("#regPassword").value;

  if (!firstName || !lastName || !email || password.length < 6) {
    showToast("Please complete registration correctly", "error");
    return;
  }

  const exists = db.users.some(u => u.email === email);
  if (exists) {
    showToast("Email already exists", "error");
    return;
  }

  db.users.push({
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email,
    password,
    role: "User",
    verified: false
  });

  saveToStorage();
  tempVerifyEmail = email;
  $("#verifyEmailText").textContent = email;
  $("#formRegister").reset();
  navigateTo("#/verify-email");
  showToast("Registration successful", "success");
}

function handleVerify() {
  if (!tempVerifyEmail) {
    showToast("No email to verify", "warning");
    return;
  }

  const user = db.users.find(u => u.email === tempVerifyEmail);
  if (!user) return;

  user.verified = true;
  saveToStorage();
  $("#verifiedDone").classList.remove("d-none");
  showToast("Email verified successfully", "success");
}

function handleLogin(e) {
  e.preventDefault();

  const email = $("#loginId").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  const loginError = $("#loginError");

  loginError.classList.add("d-none");
  loginError.textContent = "";

  const user = db.users.find(u => u.email === email && u.password === password);

  if (!user) {
    loginError.textContent = "Invalid email or password.";
    loginError.classList.remove("d-none");
    return;
  }

  if (!user.verified) {
    loginError.textContent = "Please verify your email first.";
    loginError.classList.remove("d-none");
    return;
  }

  db.currentUserId = user.id;
  saveToStorage();
  $("#formLogin").reset();
  updateAuthUI();
  showToast("Login successful", "success");
  navigateTo("#/profile");
}

function handleLogout(e) {
  e.preventDefault();
  db.currentUserId = null;
  saveToStorage();
  updateAuthUI();
  showToast("Logged out successfully", "info");
  navigateTo("#/login");
}

function handleAddAccount(e) {
  e.preventDefault();

  const firstName = $("#accFirst").value.trim();
  const lastName = $("#accLast").value.trim();
  const email = $("#accEmail").value.trim().toLowerCase();
  const password = $("#accPass").value;
  const role = $("#accRole").value;
  const verified = $("#accVerified").checked;

  if (!firstName || !lastName || !email || password.length < 6) {
    showToast("Please complete account details correctly", "error");
    return;
  }

  if (db.users.some(u => u.email === email)) {
    showToast("Email already exists", "error");
    return;
  }

  db.users.push({
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email,
    password,
    role,
    verified
  });

  saveToStorage();
  renderAll();
  $("#formAddAccount").reset();
  bootstrap.Modal.getInstance($("#modalAccount")).hide();
  showToast("Account added successfully", "success");
}

function handleAddDepartment(e) {
  e.preventDefault();

  const name = $("#deptName").value.trim();
  const description = $("#deptDesc").value.trim();

  if (!name) {
    showToast("Department name is required", "error");
    return;
  }

  if (db.departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    showToast("Department already exists", "error");
    return;
  }

  db.departments.push({
    id: crypto.randomUUID(),
    name,
    description
  });

  saveToStorage();
  renderAll();
  $("#formAddDepartment").reset();
  bootstrap.Modal.getInstance($("#modalDepartment")).hide();
  showToast("Department added successfully", "success");
}

function handleAddEmployee(e) {
  e.preventDefault();

  const userEmail = $("#empUserEmail").value;
  const position = $("#empPos").value.trim();
  const department = $("#empDept").value;
  const hireDate = $("#empHire").value;

  if (!userEmail || !position || !department || !hireDate) {
    showToast("Please complete employee details", "error");
    return;
  }

  if (db.employees.some(emp => emp.userEmail === userEmail)) {
    showToast("This user is already an employee", "warning");
    return;
  }

  db.employees.push({
    id: crypto.randomUUID(),
    userEmail,
    position,
    department,
    hireDate
  });

  saveToStorage();
  renderAll();
  $("#formAddEmployee").reset();
  bootstrap.Modal.getInstance($("#modalEmployee")).hide();
  showToast("Employee added successfully", "success");
}

function handleNewRequest(e) {
  e.preventDefault();

  const user = getCurrentUser();
  if (!user) {
    showToast("Please login first", "error");
    return;
  }

  const type = $("#reqType").value;
  const itemNames = [...document.querySelectorAll(".req-item-name")];
  const itemQtys = [...document.querySelectorAll(".req-item-qty")];

  if (!type) {
    showToast("Please select request type", "error");
    return;
  }

  const items = [];
  for (let i = 0; i < itemNames.length; i++) {
    const name = itemNames[i].value.trim();
    const qty = parseInt(itemQtys[i].value);

    if (name && qty > 0) {
      items.push({ name, qty });
    }
  }

  if (items.length === 0) {
    showToast("Add at least one valid item", "error");
    return;
  }

  db.requests.push({
    id: "REQ-" + Date.now(),
    userId: user.id,
    type,
    items,
    date: new Date().toLocaleDateString(),
    status: "Pending"
  });

  saveToStorage();
  renderAll();
  clearRequestForm();
  bootstrap.Modal.getInstance($("#modalNewRequest")).hide();
  showToast("Request submitted successfully", "success");
}

function openEditProfileModal() {
  const user = getCurrentUser();
  if (!user) return;

  $("#editFirstName").value = user.firstName;
  $("#editLastName").value = user.lastName;
  $("#editEmail").value = user.email;
  $("#editCurrentPass").value = "";
  $("#editNewPass").value = "";
  $("#editConfirmPass").value = "";

  new bootstrap.Modal($("#modalEditProfile")).show();
}

function handleEditProfile(e) {
  e.preventDefault();

  const user = getCurrentUser();
  if (!user) return;

  const firstName = $("#editFirstName").value.trim();
  const lastName = $("#editLastName").value.trim();
  const currentPass = $("#editCurrentPass").value;
  const newPass = $("#editNewPass").value;
  const confirmPass = $("#editConfirmPass").value;

  if (!firstName || !lastName || !currentPass) {
    showToast("Please complete required fields", "error");
    return;
  }

  if (currentPass !== user.password) {
    showToast("Current password is incorrect", "error");
    return;
  }

  if (newPass && newPass.length < 6) {
    showToast("New password must be at least 6 characters", "error");
    return;
  }

  if (newPass && newPass !== confirmPass) {
    showToast("New password and confirm password do not match", "error");
    return;
  }

  user.firstName = firstName;
  user.lastName = lastName;

  if (newPass) {
    user.password = newPass;
  }

  saveToStorage();
  renderAll();
  bootstrap.Modal.getInstance($("#modalEditProfile")).hide();
  showToast("Profile updated successfully", "success");
}

function initEvents() {
  $("#formRegister").addEventListener("submit", handleRegister);
  $("#btnSimulateVerify").addEventListener("click", handleVerify);
  $("#formLogin").addEventListener("submit", handleLogin);
  $("#menuLogout").addEventListener("click", handleLogout);

  $("#formAddAccount").addEventListener("submit", handleAddAccount);
  $("#formAddDepartment").addEventListener("submit", handleAddDepartment);
  $("#formAddEmployee").addEventListener("submit", handleAddEmployee);
  $("#formNewRequest").addEventListener("submit", handleNewRequest);

  $("#btnAddReqItem").addEventListener("click", () => addRequestItemRow());
  $("#btnEditProfile").addEventListener("click", openEditProfileModal);
  $("#formEditProfile").addEventListener("submit", handleEditProfile);

  window.addEventListener("hashchange", route);

  $("#modalNewRequest").addEventListener("show.bs.modal", () => {
    if ($("#reqItems").children.length === 0) addRequestItemRow();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  initEvents();
  updateAuthUI();
  renderAll();
  route();
});