export const DEFAULT_CATEGORIES = [
  "My Photos",
  "Nature",
  "Travel",
  "Family & Friends",
  "Portraits",
  "Food & Drinks",
  "Architecture",
  "Animals",
  "Art & Design",
  "Celebrations",
  "Sports",
  "Other",
];

export const CATEGORY_ICONS = {
  "my photos": "📸",
  "favorites": "❤️",
  "nature": "🍃",
  "travel": "✈️",
  "family & friends": "👥",
  "portraits": "👤",
  "food & drinks": "🍔",
  "architecture": "🏛️",
  "animals": "🐾",
  "art & design": "🎨",
  "celebrations": "🎉",
  "sports": "⚽",
  "other": "📁",
};

export const getCategoryIcon = (category) => {
  if (!category) return "📁";
  const key = category.trim().toLowerCase();
  return CATEGORY_ICONS[key] || "📁";
};

export const getSavedCustomCategories = () => {
  try {
    const saved = localStorage.getItem("photo_custom_categories");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Failed to load custom categories:", err);
    return [];
  }
};

export const saveCustomCategories = (categories) => {
  try {
    localStorage.setItem("photo_custom_categories", JSON.stringify(categories));
  } catch (err) {
    console.error("Failed to save custom categories:", err);
  }
};

export const getDeletedCategories = () => {
  try {
    const saved = localStorage.getItem("photo_deleted_categories");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    return [];
  }
};

export const saveDeletedCategories = (categories) => {
  try {
    localStorage.setItem("photo_deleted_categories", JSON.stringify(categories));
  } catch (err) {
    console.error("Failed to save deleted categories:", err);
  }
};
