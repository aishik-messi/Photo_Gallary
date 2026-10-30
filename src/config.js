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

export const isVideoMedia = (item) => {
  if (!item) return false;
  if (typeof item === "string") {
    const s = item.toLowerCase();
    return (
      s.endsWith(".mp4") ||
      s.endsWith(".webm") ||
      s.endsWith(".mov") ||
      s.endsWith(".ogg") ||
      s.endsWith(".m4v") ||
      s.startsWith("data:video/")
    );
  }
  if (item.mediaType === "video") return true;
  const url = (item.imageUrl || item.image || item.url || "").toLowerCase();
  return (
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov") ||
    url.endsWith(".ogg") ||
    url.endsWith(".m4v") ||
    url.startsWith("data:video/")
  );
};
