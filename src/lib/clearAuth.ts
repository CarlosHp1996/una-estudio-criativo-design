// Clear Auth Data for Debug
function clearAuthData() {
  // Remove tokens
  localStorage.removeItem("una_token");
  localStorage.removeItem("una_user");

  // Remove cookies
  document.cookie =
    "una_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// Add to window for testing
if (typeof window !== "undefined") {
  (window as any).clearAuthData = clearAuthData;
}
