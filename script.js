// =====================
// PHASE 4: Data Persistence with localStorage
// =====================

const STORAGE_KEY = "ipt_demo_v1";          // REQUIRED (Phase 4)
const LS_UNVERIFIED_EMAIL = "unverified_email";
const LS_AUTH_TOKEN = "auth_token";

let currentUser = null;

// Set true ONCE if you need reset; after working, set back to false.
const FORCE_RESET_STORAGE = false;

// ---------------------
// Phase 4: load/save
// ---------------------
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function loadFromStorage() {
  try {
    if (FORCE_RESET_STORAGE) localStorage.removeItem(STORAGE_KEY);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("missing");

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("corrupt");

    // minimal validation
    if (!Array.isArray(parsed.accounts)) throw new Error("corrupt accounts");
    if (!Array.isArray(parsed.departments)) throw new Error("corrupt departments");
    if (!Array.isArray(parsed.employees)) parsed.employees = [];
    if (!Array.isArray(parsed.requests)) parsed.requests = [];

    window.db = parsed;
    return;
  } catch (e) {
    // Seed required data if missing/corrupt
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
        { id: uid(), name: "Engineering", description: "Software team" },
        { id: uid(), name: "HR", description: "Human Resources" }
      ],
      employees: [],
      requests: []
    };
    saveToStorage();
  }
}

// ---------------------
// Helpers
// ---------------------
function uid() {
  return Math.random().toString(16).slice(2, 10);
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

// ---------------------
// UI Page switching
// ---------------------
function hideAllPages() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
}

function showPage(pageId) {
  const el = document.getElementById(pageId);
  if (el) el.classList.add("active");
}

// ---------------------
// Phase 3: Auth State
// ---------------------
function setAuthState(isAuth, user = null) {
  const body = document.body;
  body.classList.remove("authenticated", "not-authenticated", "is-admin");

  if (!isAuth || !user) {
    currentUser = null;
    body.classList.add("not-authenticated");
    const navUsername = document.getElementById("navUsername");
    if (navUsername) navUsername.textContent = "User";
    return;
  }

  currentUser = user;

  body.classList.add("authenticated");
  if (user.role === "Admin") body.classList.add("is-admin");

  const navUsername = document.getElementById("navUsername");
  if (navUsername) navUsername.textContent = user.firstName || user.email || "User";

  const profName = document.getElementById("profName");
  const profEmail = document.getElementById("profEmail");
  const profRole = document.getElementById("profRole");

  if (profName) profName.textContent = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  if (profEmail) profEmail.textContent = user.email || "(no email)";
  if (profRole) profRole.textContent = user.role || "User";
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

// ---------------------
// Phase 2 Routing
// ---------------------
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
    "#/requests": "page-requests"
  };

  const protectedRoutes = new Set([
    "#/profile",
    "#/employees",
    "#/accounts",
    "#/departments",
    "#/requests"
  ]);

  const adminRoutes = new Set([
    "#/employees",
    "#/accounts",
    "#/departments"
  ]);

  if (protectedRoutes.has(hash) && !currentUser) {
    navigateTo("#/login");
    return;
  }

  if (adminRoutes.has(hash) && currentUser?.role !== "Admin") {
    alert("Admin only page.");
    navigateTo("#/profile");
    return;
  }

  hideAllPages();
  showPage(routes[hash] || "page-home");

  // Update verify email text
  if (hash === "#/verify-email") {
    const pendingEmail = localStorage.getItem(LS_UNVERIFIED_EMAIL) || "---";
    const verifySpan = document.getElementById("verifyEmailText");
    if (verifySpan) verifySpan.textContent = pendingEmail;
  }

  // Render pages after route
  renderAll();
}

// ---------------------
// Render functions
// ---------------------
function renderAll() {
  renderDepartments();
  renderEmployees();
  renderAccounts();
  renderRequests();
  fillEmployeeDeptOptions();
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

function renderDepartments() {
  const tb = document.getElementById("tblDepartments");
  if (!tb) return;

  tb.innerHTML = "";

  window.db.departments.forEach(dep => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dep.name}</td>
      <td>${dep.description || ""}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit">Edit</button>
        <button class="btn btn-sm btn-outline-danger" data-action="del">Delete</button>
      </td>
    `;

    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openDepartmentEdit(dep.id));
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteDepartment(dep.id));

    tb.appendChild(tr);
  });
}

function renderEmployees() {
  const tb = document.getElementById("tblEmployees");
  if (!tb) return;

  tb.innerHTML = "";

  window.db.employees.forEach(emp => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.position}</td>
      <td>${emp.department}</td>
      <td>${fmtDate(emp.hireDate)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit">Edit</button>
        <button class="btn btn-sm btn-outline-danger" data-action="del">Delete</button>
      </td>
    `;

    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openEmployeeEdit(emp.id));
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteEmployee(emp.id));

    tb.appendChild(tr);
  });
}

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
      <td>${acc.role}</td>
      <td>${acc.verified ? "✅" : "❌"}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-warning me-1" data-action="reset">Reset Password</button>
        <button class="btn btn-sm btn-outline-danger" data-action="del">Delete</button>
      </td>
    `;

    tr.querySelector('[data-action="reset"]').addEventListener("click", () => resetPassword(acc.email));
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteAccount(acc.email));

    tb.appendChild(tr);
  });
}

function renderRequests() {
  const wrap = document.getElementById("reqTableWrap");
  const empty = document.getElementById("reqEmpty");
  const tb = document.getElementById("tblRequests");
  if (!wrap || !empty || !tb) return;

  tb.innerHTML = "";

  const myEmail = currentUser ? normalizeEmail(currentUser.email) : "";
  const my = window.db.requests.filter(r => normalizeEmail(r.ownerEmail) === myEmail);

  if (my.length === 0) {
    empty.classList.remove("d-none");
    wrap.classList.add("d-none");
    return;
  }

  empty.classList.add("d-none");
  wrap.classList.remove("d-none");

  my.forEach(r => {
    const itemsText = (r.items || []).map(it => `${it.name} (${it.qty})`).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.type}</td>
      <td>${itemsText}</td>
      <td>${fmtDate(r.createdAt)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" data-action="del">Delete</button>
      </td>
    `;
    tr.querySelector('[data-action="del"]').addEventListener("click", () => deleteRequest(r.id));
    tb.appendChild(tr);
  });
}

// ---------------------
// AUTH: Register / Verify / Login / Logout
// ---------------------
document.getElementById("formRegister")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("regFirst").value.trim();
  const lastName = document.getElementById("regLast").value.trim();
  const email = normalizeEmail(document.getElementById("regEmail").value);
  const password = document.getElementById("regPassword").value;

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const exists = window.db.accounts.some(a => normalizeEmail(a.email) === email);
  if (exists) {
    alert("Email already exists. Please login.");
    navigateTo("#/login");
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

  saveToStorage(); // Phase 4 required

  localStorage.setItem(LS_UNVERIFIED_EMAIL, email);
  navigateTo("#/verify-email");
});

document.getElementById("btnSimulateVerify")?.addEventListener("click", () => {
  const email = normalizeEmail(localStorage.getItem(LS_UNVERIFIED_EMAIL));
  if (!email) return;

  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === email);
  if (!acc) {
    alert("Account not found.");
    return;
  }

  acc.verified = true;
  saveToStorage(); // Phase 4 required

  localStorage.removeItem(LS_UNVERIFIED_EMAIL);

  document.getElementById("verifiedDone")?.classList.remove("d-none");
  navigateTo("#/login");
});

document.getElementById("formLogin")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = normalizeEmail(document.getElementById("loginId").value);
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");

  err.classList.add("d-none");
  err.textContent = "";

  const acc = window.db.accounts.find(a =>
    normalizeEmail(a.email) === email &&
    a.password === password &&
    a.verified === true
  );

  if (!acc) {
    err.textContent = "Invalid email/password OR email not verified.";
    err.classList.remove("d-none");
    return;
  }

  localStorage.setItem(LS_AUTH_TOKEN, acc.email);
  setAuthState(true, acc);
  navigateTo("#/profile");
});

document.getElementById("menuLogout")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem(LS_AUTH_TOKEN);
  setAuthState(false);
  navigateTo("#/home");
});

// ---------------------
// CRUD: Departments
// ---------------------
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

  if (!confirm(`Delete department "${dep.name}"?`)) return;

  window.db.departments = window.db.departments.filter(d => d.id !== id);
  saveToStorage();
  renderAll();
}

document.getElementById("formAddDepartment")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("deptId").value.trim();
  const name = document.getElementById("deptName").value.trim();
  const desc = document.getElementById("deptDesc").value.trim();

  if (!name) return;

  if (id) {
    const dep = window.db.departments.find(d => d.id === id);
    if (dep) {
      dep.name = name;
      dep.description = desc;
    }
  } else {
    window.db.departments.push({ id: uid(), name, description: desc });
  }

  saveToStorage();
  renderAll();

  document.getElementById("deptId").value = "";
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("modalDepartment"))?.hide();
});

// ---------------------
// CRUD: Employees
// ---------------------
function openEmployeeEdit(id) {
  const emp = window.db.employees.find(x => x.id === id);
  if (!emp) return;

  document.getElementById("empId").value = emp.id;
  document.getElementById("empName").value = emp.name;
  document.getElementById("empPos").value = emp.position;
  document.getElementById("empDept").value = emp.department;
  document.getElementById("empHire").value = emp.hireDate;

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEmployee"));
  modal.show();
}

function deleteEmployee(id) {
  if (!confirm("Delete this employee?")) return;

  window.db.employees = window.db.employees.filter(e => e.id !== id);
  saveToStorage();
  renderAll();
}

document.getElementById("formAddEmployee")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("empId").value.trim();
  const name = document.getElementById("empName").value.trim();
  const position = document.getElementById("empPos").value.trim();
  const department = document.getElementById("empDept").value;
  const hireDate = document.getElementById("empHire").value;

  if (id) {
    const emp = window.db.employees.find(x => x.id === id);
    if (emp) {
      emp.name = name;
      emp.position = position;
      emp.department = department;
      emp.hireDate = hireDate;
    }
  } else {
    window.db.employees.push({
      id: uid(),
      name,
      position,
      department,
      hireDate
    });
  }

  saveToStorage();
  renderAll();

  document.getElementById("empId").value = "";
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("modalEmployee"))?.hide();
});

// ---------------------
// CRUD: Accounts (Admin)
// ---------------------
function resetPassword(email) {
  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === normalizeEmail(email));
  if (!acc) return;

  const newPass = prompt("Enter new password (min 6 chars):");
  if (!newPass) return;
  if (newPass.length < 6) return alert("Password too short.");

  acc.password = newPass;
  saveToStorage();
  renderAll();
}

function deleteAccount(email) {
  const target = normalizeEmail(email);

  // protect deleting current admin token user
  if (normalizeEmail(currentUser?.email) === target) {
    alert("You cannot delete the account currently logged in.");
    return;
  }

  if (!confirm("Delete this account?")) return;

  window.db.accounts = window.db.accounts.filter(a => normalizeEmail(a.email) !== target);
  saveToStorage();
  renderAll();
}

document.getElementById("formAddAccount")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("accFirst").value.trim();
  const lastName = document.getElementById("accLast").value.trim();
  const email = normalizeEmail(document.getElementById("accEmail").value);
  const password = document.getElementById("accPass").value;
  const role = document.getElementById("accRole").value;
  const verified = document.getElementById("accVerified").checked;

  if (password.length < 6) return alert("Password must be at least 6 characters.");

  if (window.db.accounts.some(a => normalizeEmail(a.email) === email)) {
    return alert("Email already exists.");
  }

  window.db.accounts.push({
    firstName,
    lastName,
    email,
    password,
    role,
    verified
  });

  saveToStorage();
  renderAll();

  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("modalAccount"))?.hide();
});

// ---------------------
// CRUD: Requests
// ---------------------
function addRequestItemRow() {
  const container = document.getElementById("reqItems");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "d-flex gap-2 align-items-center mb-2";

  row.innerHTML = `
    <input class="form-control" placeholder="Item name" required />
    <input class="form-control" type="number" min="1" value="1" style="max-width:90px;" required />
    <button class="btn btn-outline-danger" type="button">x</button>
  `;

  row.querySelector("button").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

document.getElementById("btnAddReqItem")?.addEventListener("click", () => {
  addRequestItemRow();
});

document.getElementById("modalNewRequest")?.addEventListener("shown.bs.modal", () => {
  const container = document.getElementById("reqItems");
  if (container && container.children.length === 0) addRequestItemRow();
});

document.getElementById("formNewRequest")?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return alert("Please login first.");

  const type = document.getElementById("reqType").value.trim();
  const rows = Array.from(document.querySelectorAll("#reqItems > div"));

  const items = rows.map(r => {
    const inputs = r.querySelectorAll("input");
    return {
      name: inputs[0].value.trim(),
      qty: Number(inputs[1].value)
    };
  }).filter(x => x.name && x.qty > 0);

  if (items.length === 0) return alert("Add at least 1 item.");

  window.db.requests.push({
    id: uid(),
    ownerEmail: currentUser.email,
    type,
    items,
    createdAt: new Date().toISOString()
  });

  saveToStorage();
  renderAll();

  // reset modal content
  document.getElementById("reqType").value = "";
  document.getElementById("reqItems").innerHTML = "";
  bootstrap.Modal.getInstance(document.getElementById("modalNewRequest"))?.hide();
});

function deleteRequest(id) {
  if (!confirm("Delete this request?")) return;

  window.db.requests = window.db.requests.filter(r => r.id !== id);
  saveToStorage();
  renderAll();
}

// ---------------------
// INIT (Phase 4 required)
// ---------------------
loadFromStorage(); // REQUIRED (Phase 4)
window.addEventListener("hashchange", handleRouting);
handleRouting();