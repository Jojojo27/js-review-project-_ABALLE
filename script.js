console.log("PHASE 1 loaded");

// For Phase 1: we simulate logged in / not logged in
// Later phases will make it real using localStorage.

const navGuest = document.getElementById("navGuest");
const navUser = document.getElementById("navUser");

const btnGetStarted = document.getElementById("btnGetStarted");

// ✅ For now: default is NOT logged in
navUser.style.display = "none";
navGuest.style.display = "flex";

btnGetStarted.addEventListener("click", () => {
  alert("Next phases will add Login/Register and role-based navigation!");
});