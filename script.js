// ====== Helpers (localStorage keys) ======
const LS_USERS = "fs_users";
const LS_SESSION = "fs_session";
const LS_PENDING_VERIFY = "fs_pending_verify";

// ✅ One-time reset switch (IMPORTANT)
// Set to true ONCE to reseed demo users, then set back to false.
const FORCE_RESEED_DEMO_USERS = true;

// ====== Seed demo users (Admin + User) ======
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
      email: "admin@example.com",     // ✅ do NOT leave empty
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

// ====== UI: Pages ======
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(pageId);
  if (el) el.classList.add("active");
}

// ====== UI: Auth state (body classes) ======
function applyAuthUI() {
  const session = getSession();
  const body = document.body;

  body.classList.remove("authenticated", "not-authenticated", "is-admin");

  if (!session) {
    body.classList.add("not-authenticated");
    document.getElementById("navUsername").textContent = "User";
    return;
  }

  body.classList.add("authenticated");
  if (session.role === "Admin") body.classList.add("is-admin");

  document.getElementById("navUsername").textContent =
    session.firstName || session.username || "User";

  document.getElementById("profName").textContent =
    `${session.firstName || ""} ${session.lastName || ""}`.trim() || "User";

  document.getElementById("profEmail").textContent = session.email || "(no email)";
  document.getElementById("profRole").textContent = session.role || "User";
}

// ====== Router (hash navigation) ======
function route() {
  const hash = (location.hash || "#home").replace("#", "");
  const session = getSession();

  const map = {
    home: "page-home",
    register: "page-register",
    verify: "page-verify",
    login: "page-login",
    profile: "page-profile",
    employees: "page-employees",
    departments: "page-departments",
    accounts: "page-accounts",
    requests: "page-requests"
  };

  const needsAuth = ["profile", "employees", "departments", "accounts", "requests"];
  if (needsAuth.includes(hash) && !session) {
    location.hash = "#login";
    return;
  }

  const adminOnly = ["employees", "departments", "accounts"];
  if (adminOnly.includes(hash) && session?.role !== "Admin") {
    alert("Admin only page.");
    location.hash = "#profile";
    return;
  }

  const pageId = map[hash] || "page-home";
  showPage(pageId);

  if (hash === "verify") {
    const pendingEmail = localStorage.getItem(LS_PENDING_VERIFY) || "---";
    document.getElementById("verifyEmailText").textContent = pendingEmail;
  }
}

// ====== Register (creates USER account) ======
document.getElementById("formRegister").addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("regFirst").value.trim();
  const lastName = document.getElementById("regLast").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;

  const users = getUsers();

  // prevent duplicate email
  if (users.some(u => (u.email || "").toLowerCase() === email)) {
    alert("Email already exists. Please login.");
    location.hash = "#login";
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
  location.hash = "#verify";
});

// ====== Verify Email (simulate) ======
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

// ====== Login (username OR email) ======
document.getElementById("formLogin").addEventListener("submit", (e) => {
  e.preventDefault();

  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  const users = getUsers();

  const user = users.find(u =>
    ((u.username || "").toLowerCase() === loginId ||
     (u.email || "").toLowerCase() === loginId) &&
    u.password === password
  );

  const err = document.getElementById("loginError");
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
    location.hash = "#verify";
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

  applyAuthUI();
  location.hash = "#profile";
});

// ====== Logout ======
document.getElementById("menuLogout").addEventListener("click", (e) => {
  e.preventDefault();
  clearSession();
  applyAuthUI();
  location.hash = "#home";
});

// ====== Init ======
seedDemoUsers();
applyAuthUI();
window.addEventListener("hashchange", route);
route();