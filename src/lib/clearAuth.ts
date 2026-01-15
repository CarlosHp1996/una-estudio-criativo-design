// Clear Auth Data for Debug
function clearAuthData() {
  console.log("🧹 Clearing all auth data...");

  // Remove tokens
  localStorage.removeItem("una_token");
  localStorage.removeItem("una_user");

  // Remove cookies
  document.cookie =
    "una_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  console.log("✅ Auth data cleared");

  // Show current state
  console.log("Current localStorage:", {
    token: localStorage.getItem("una_token"),
    user: localStorage.getItem("una_user"),
  });
}

// Add to window for testing
if (typeof window !== "undefined") {
  (window as any).clearAuthData = clearAuthData;
}
