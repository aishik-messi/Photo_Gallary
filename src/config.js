// Centralized configuration for API and media URLs
// Dynamically detects current hostname so local network testing (iPhone / Android on Wi-Fi) works out of the box.

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000");

export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
