const LS_USERS = "fs_users";
const LS_SESSION = "fs_session";
const LS_PENDING_VERIFY = "fs_pending_verify";

let currentUser = null;

// Set true ONCE if you need reset; after working, set back to false.
const FORCE_RESEED_DEMO_USERS = false;

// ====== Seed demo users ======
function seedDemoUsers() {
  if (FORCE_RESEED_DEMO_USERS) {
    localStorage.removeItem(LS_USERS);
    localStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_PENDING_VERIFY);
  }

  const existing = JSON.parse(localStorage.getItem(LS_USERS) || "[]");
  if (existing.length > 0) return;

  const demo = [
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      username: "admin123",
      password: "Password123!",
      role: "Admin",
      verified: true
    },
    {
      firstName: "Normal",
      lastName: "User",
      email: "user@example.com",
      username: "user1",
      password: "user123",
      role: "User",
      verified: true
    }
  ];

  localStorage.setItem(LS_USERS, JSON.stringify(demo));
}

function getUsers() {
  return JSON.parse(localStorage.getItem(LS_USERS) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

function getSession() {
  return JSON.parse(localStorage.getItem(LS_SESSION) || "null");
}

function setSession(session) {
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(LS_SESSION);
}

// ====== UI ======
function hideAllPages() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
}

function showPage(pageId) {
  const el = document.getElementById(pageId);
  if (el) el.classList.add("active");
}

function applyAuthUI() {
  const body = document.body;
  body.classList.remove("authenticated", "not-authenticated", "is-admin");

  if (!currentUser) {
    body.classList.add("not-authenticated");
    document.getElementById("navUsername").textContent = "User";
    return;
  }

  body.classList.add("authenticated");
  if (currentUser.role === "Admin") body.classList.add("is-admin");

  document.getElementById("navUsername").textContent =
    currentUser.firstName || currentUser.username || "User";

  document.getElementById("profName").textContent =
    `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();

  document.getElementById("profEmail").textContent = currentUser.email || "(no email)";
  document.getElementById("profRole").textContent = currentUser.role || "User";
}

// ====== Phase 2 Routing ======
function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  currentUser = getSession();
  applyAuthUI();

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
    "#/verify": "page-verify",
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
  const pageId = routes[hash] || "page-home";
  showPage(pageId);

  if (hash === "#/verify") {
    const pendingEmail = localStorage.getItem(LS_PENDING_VERIFY) || "---";
    document.getElementById("verifyEmailText").textContent = pendingEmail;
  }
}

// ====== Register ======
document.getElementById("formRegister").addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("regFirst").value.trim();
  const lastName = document.getElementById("regLast").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;

  const users = getUsers();

  if (users.some(u => (u.email || "").toLowerCase() === email)) {
    alert("Email already exists. Please login.");
    navigateTo("#/login");
    return;
  }

  const username = email.split("@")[0];

  users.push({
    firstName,
    lastName,
    email,
    username,
    password,
    role: "User",
    verified: false
  });

  saveUsers(users);
  localStorage.setItem(LS_PENDING_VERIFY, email);
  navigateTo("#/verify");
});

// ====== Verify ======
document.getElementById("btnSimulateVerify").addEventListener("click", () => {
  const email = (localStorage.getItem(LS_PENDING_VERIFY) || "").toLowerCase();
  if (!email) return;

  const users = getUsers();
  const idx = users.findIndex(u => (u.email || "").toLowerCase() === email);

  if (idx >= 0) {
    users[idx].verified = true;
    saveUsers(users);
  }

  document.getElementById("verifiedDone").classList.remove("d-none");
});

// ====== Login ======
document.getElementById("formLogin").addEventListener("submit", (e) => {
  e.preventDefault();

  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");

  const users = getUsers();

  const user = users.find(u =>
    ((u.username || "").toLowerCase() === loginId ||
     (u.email || "").toLowerCase() === loginId) &&
    u.password === password
  );

  err.classList.add("d-none");
  err.textContent = "";

  if (!user) {
    err.textContent = "Invalid username/email or password.";
    err.classList.remove("d-none");
    return;
  }

  if (!user.verified) {
    localStorage.setItem(LS_PENDING_VERIFY, user.email || "");
    alert("Please verify your email first (demo).");
    navigateTo("#/verify");
    return;
  }

  setSession({
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    token: "fake-jwt-" + Math.random().toString(16).slice(2)
  });

  currentUser = getSession();
  applyAuthUI();

  navigateTo(currentUser.role === "Admin" ? "#/profile" : "#/profile");
});

// ====== Logout ======
document.getElementById("menuLogout").addEventListener("click", (e) => {
  e.preventDefault();
  clearSession();
  currentUser = null;
  applyAuthUI();
  navigateTo("#/");
});

// ====== Modal Demo Handlers (Phase 2) ======
document.getElementById("formAddEmployee").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Employee saved (Phase 2 demo).");
});

document.getElementById("formAddAccount").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Account saved (Phase 2 demo).");
});

document.getElementById("formAddDepartment").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Department saved (Phase 2 demo).");
});

// Requests dynamic items
function addRequestItemRow() {
  const container = document.getElementById("reqItems");
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

document.getElementById("btnAddReqItem").addEventListener("click", () => {
  addRequestItemRow();
});

document.getElementById("modalNewRequest").addEventListener("shown.bs.modal", () => {
  const container = document.getElementById("reqItems");
  if (container.children.length === 0) addRequestItemRow();
});

document.getElementById("formNewRequest").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Request submitted (Phase 2 demo).");
});

// ====== Init ======
seedDemoUsers();
window.addEventListener("hashchange", handleRouting);
handleRouting();