// =====================
// PHASE 3 AUTH SYSTEM (built on PHASE 2 routing + modals)
// =====================

// ====== PHASE 3 Storage Keys ======
const LS_DB = "fs_db";                      // stores window.db
const LS_UNVERIFIED_EMAIL = "unverified_email";
const LS_AUTH_TOKEN = "auth_token";

// Global current user (Phase 2 requirement)
let currentUser = null;

// Set true ONCE if you need reset; after working, set back to false.
const FORCE_RESEED_DEMO_USERS = false;

// ====== PHASE 3 Database ======
function loadDB() {
  const raw = localStorage.getItem(LS_DB);
  if (raw) return JSON.parse(raw);
  return {
    accounts: []
  };
}

function saveDB() {
  localStorage.setItem(LS_DB, JSON.stringify(window.db));
}

window.db = loadDB();

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ====== Seed demo accounts (Admin + User) ======
function seedDemoAccounts() {
  if (FORCE_RESEED_DEMO_USERS) {
    localStorage.removeItem(LS_DB);
    localStorage.removeItem(LS_AUTH_TOKEN);
    localStorage.removeItem(LS_UNVERIFIED_EMAIL);
    window.db = loadDB();
  }

  if (window.db.accounts.length > 0) return;

  window.db.accounts.push(
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "Password123!",
      role: "Admin",
      verified: true
    },
    {
      firstName: "Normal",
      lastName: "User",
      email: "user@example.com",
      password: "user123",
      role: "User",
      verified: true
    }
  );

  saveDB();
}

// ====== UI ======
function hideAllPages() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
}

function showPage(pageId) {
  const el = document.getElementById(pageId);
  if (el) el.classList.add("active");
}

// =====================
// D) AUTH STATE MANAGEMENT (Phase 3 required)
// =====================
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

  // Navbar
  const navUsername = document.getElementById("navUsername");
  if (navUsername) navUsername.textContent = user.firstName || user.email || "User";

  // Profile fields
  const profName = document.getElementById("profName");
  const profEmail = document.getElementById("profEmail");
  const profRole = document.getElementById("profRole");

  if (profName) profName.textContent = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  if (profEmail) profEmail.textContent = user.email || "(no email)";
  if (profRole) profRole.textContent = user.role || "User";
}

// Restore auth from token
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

// ====== PHASE 2 Routing ======
function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  // Always sync auth state from token
  restoreAuthFromToken();

  let hash = window.location.hash;

  if (!hash || hash === "#") {
    navigateTo("#/");
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

  // Redirect unauthenticated users away from protected routes
  if (protectedRoutes.has(hash) && !currentUser) {
    navigateTo("#/login");
    return;
  }

  // Block non-admins from admin routes
  if (adminRoutes.has(hash) && currentUser?.role !== "Admin") {
    alert("Admin only page.");
    navigateTo("#/profile");
    return;
  }

  hideAllPages();
  const pageId = routes[hash] || "page-home";
  showPage(pageId);

  // Verify email page text
  if (hash === "#/verify-email") {
    const pendingEmail = localStorage.getItem(LS_UNVERIFIED_EMAIL) || "---";
    const verifySpan = document.getElementById("verifyEmailText");
    if (verifySpan) verifySpan.textContent = pendingEmail;
  }
}

// =====================
// A) REGISTRATION (Phase 3 required)
// =====================
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

  // Check if email already exists
  const exists = window.db.accounts.some(a => normalizeEmail(a.email) === email);
  if (exists) {
    alert("Email already exists. Please login.");
    navigateTo("#/login");
    return;
  }

  // Save new account
  window.db.accounts.push({
    firstName,
    lastName,
    email,
    password,
    role: "User",
    verified: false
  });

  saveDB();

  // Store email in unverified_email
  localStorage.setItem(LS_UNVERIFIED_EMAIL, email);

  // Navigate to verify-email
  navigateTo("#/verify-email");
});

// =====================
// B) EMAIL VERIFICATION (Simulated) (Phase 3 required)
// =====================
document.getElementById("btnSimulateVerify")?.addEventListener("click", () => {
  const email = normalizeEmail(localStorage.getItem(LS_UNVERIFIED_EMAIL));
  if (!email) return;

  const acc = window.db.accounts.find(a => normalizeEmail(a.email) === email);
  if (!acc) {
    alert("Account not found.");
    return;
  }

  acc.verified = true;
  saveDB();

  localStorage.removeItem(LS_UNVERIFIED_EMAIL);

  const done = document.getElementById("verifiedDone");
  if (done) done.classList.remove("d-none");

  navigateTo("#/login");
});

// =====================
// C) LOGIN (Email + Password, verified:true) (Phase 3 required)
// =====================
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

  // Save auth token = email
  localStorage.setItem(LS_AUTH_TOKEN, acc.email);

  // Set auth state
  setAuthState(true, acc);

  // Navigate to profile
  navigateTo("#/profile");
});

// =====================
// E) LOGOUT (Phase 3 required)
// =====================
document.getElementById("menuLogout")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem(LS_AUTH_TOKEN);
  setAuthState(false);
  navigateTo("#/");
});

// =====================
// Modal Demo Handlers (keep)
// =====================
document.getElementById("formAddEmployee")?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Employee saved (demo).");
});

document.getElementById("formAddAccount")?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Account saved (demo).");
});

document.getElementById("formAddDepartment")?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Department saved (demo).");
});

// Requests dynamic items
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
  alert("Request submitted (demo).");
});

// =====================
// INIT
// =====================
seedDemoAccounts();
window.addEventListener("hashchange", handleRouting);
handleRouting();