import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL, resolveImageUrl as resolveImage } from "../config";
import {
  DEFAULT_CATEGORIES,
  getCategoryIcon,
  getSavedCustomCategories,
  saveCustomCategories,
  getDeletedCategories,
  saveDeletedCategories,
} from "../data/categories";
import defaultPhotos from "../data/photos";

import AddPhoto from "./AddPhoto";
import ImageModal from "./ImageModal";
import ProfileModal from "./ProfileModal";
import PhotoKeeperMascot from "./PhotoKeeperMascot";
import ThemeToggleSwitch from "./ThemeToggleSwitch";
import "./NewDashboard.css";

function Dashboard({ darkMode, toggleDarkMode, onGoToLanding }) {
  const { user, token, logout } = useAuth();

  /* ── Modals & Drawers ── */
  const [profileOpen, setProfileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [albumModalError, setAlbumModalError] = useState("");
  const [createModalInitialCategory, setCreateModalInitialCategory] = useState("My Photos");
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [albumsViewMode, setAlbumsViewMode] = useState(() => {
    try {
      return localStorage.getItem("albums_view_mode") || "list";
    } catch {
      return "list";
    }
  });

  const handleSetAlbumsViewMode = (mode) => {
    setAlbumsViewMode(mode);
    try {
      localStorage.setItem("albums_view_mode", mode);
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Active sidebar tab & filters ── */
  const [activeTab, setActiveTab] = useState("Photos"); // 'Photos' | 'Albums' | 'Locations' | 'Friends' | 'Settings'
  const [selectedFilter, setSelectedFilter] = useState("All Photos");
  const [search, setSearch] = useState("");

  /* ── Custom & Deleted Categories ── */
  const [customCategories, setCustomCategories] = useState(() => getSavedCustomCategories());
  const [deletedCategories, setDeletedCategories] = useState(() => getDeletedCategories());

  useEffect(() => {
    saveCustomCategories(customCategories);
  }, [customCategories]);

  useEffect(() => {
    saveDeletedCategories(deletedCategories);
  }, [deletedCategories]);

  const handleAddCategory = (newCat) => {
    if (!newCat || typeof newCat !== "string") return;
    const trimmed = newCat.trim();
    if (!trimmed) return;
    // Un-delete if previously deleted
    setDeletedCategories((prev) => prev.filter((d) => d.toLowerCase() !== trimmed.toLowerCase()));
    setCustomCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, trimmed];
    });
  };

  const handleRestoreCategories = () => {
    if (window.confirm("Restore all previously deleted default folders?")) {
      setDeletedCategories([]);
    }
  };

  const onRequestDeleteFolder = (catName) => {
    if (!catName || catName.toLowerCase() === "all photos" || catName.toLowerCase() === "favorites") return;
    if (catName.toLowerCase() === "my photos") {
      alert('"My Photos" is the primary default album and cannot be deleted.');
      return;
    }

    const matchingPhotos = photos.filter(
      (p) => (p.category || p.album || "").trim().toLowerCase() === catName.toLowerCase()
    );

    if (matchingPhotos.length === 0) {
      if (window.confirm(`Are you sure you want to delete the folder "${catName}"?`)) {
        performDeleteFolder(catName, "none");
      }
    } else {
      setDeleteFolderTarget({
        title: catName,
        photoCount: matchingPhotos.length,
        photos: matchingPhotos,
      });
    }
  };

  const performDeleteFolder = async (folderName, photoAction = "move") => {
    const targetTitle = folderName;
    const targetLower = targetTitle.toLowerCase();

    // 1. Mark as deleted in storage
    setDeletedCategories((prev) => {
      if (prev.some((d) => d.toLowerCase() === targetLower)) return prev;
      return [...prev, targetTitle];
    });
    setCustomCategories((prev) => prev.filter((c) => c.toLowerCase() !== targetLower));

    // 2. Handle photos
    if (photoAction === "move") {
      setPhotos((prev) =>
        prev.map((p) => {
          if ((p.category || p.album || "").trim().toLowerCase() === targetLower) {
            return {
              ...p,
              category: "My Photos",
              album: "My Photos",
            };
          }
          return p;
        })
      );
    } else if (photoAction === "delete") {
      const photosToDelete = photos.filter(
        (p) => (p.category || p.album || "").trim().toLowerCase() === targetLower
      );
      const idsToDelete = photosToDelete.map((p) => p.id);

      if (token && idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          try {
            await fetch(`${BACKEND_URL}/api/photos/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (e) {
            console.error("Error deleting remote photo:", e);
          }
        }
      }

      setPhotos((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
      setFavorites((prev) => prev.filter((fid) => !idsToDelete.includes(fid)));
      if (selectedPhoto && idsToDelete.includes(selectedPhoto.id)) {
        setSelectedPhoto(null);
      }
    }

    // 3. Reset filter if needed
    if (selectedFilter.toLowerCase() === targetLower) {
      setSelectedFilter("All Photos");
    }

    setDeleteFolderTarget(null);
  };

  const handleCreateAlbumSubmit = (e, andAddPhoto = false) => {
    if (e) e.preventDefault();
    const trimmed = newAlbumName.trim();
    if (!trimmed) {
      setAlbumModalError("Please enter an album name.");
      return;
    }
    setAlbumModalError("");
    handleAddCategory(trimmed);
    setSelectedFilter(trimmed);
    setActiveTab("Photos");
    setAlbumModalOpen(false);
    setNewAlbumName("");

    if (andAddPhoto) {
      setCreateModalInitialCategory(trimmed);
      setCreateModalOpen(true);
    }
  };

  /* ── Favorites ── */
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("photo_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("photo_favorites", JSON.stringify(favorites));
    } catch (err) {
      console.error("Failed to save favorites:", err);
    }
  }, [favorites]);

  /* ── Photos (Loaded from dynamic localStorage, server, or curated defaults) ── */
  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem("dynamic_photos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if user has uploaded custom photos
          const defaultIds = new Set(defaultPhotos.map((dp) => dp.id));
          const userCustomPhotos = parsed.filter((p) => !defaultIds.has(p.id));
          // If only old defaults (length < 17 and no custom uploads), use the full 17 new defaults
          if (userCustomPhotos.length === 0 && parsed.length < defaultPhotos.length) {
            return defaultPhotos;
          }
          // Backfill missing default photos to keep the 5-column mosaic rhythm complete
          const existingIds = new Set(parsed.map((p) => p.id));
          const missingDefaults = defaultPhotos.filter((dp) => !existingIds.has(dp.id));
          return [...parsed, ...missingDefaults];
        }
      }
      return defaultPhotos;
    } catch {
      return defaultPhotos;
    }
  });

  const [loadingBackend, setLoadingBackend] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem("dynamic_photos", JSON.stringify(photos));
    } catch (err) {
      console.error("Failed to persist photos:", err);
    }
  }, [photos]);

  // Fetch from server if logged in
  useEffect(() => {
    if (!token) return;
    const fetchPhotos = async () => {
      setLoadingBackend(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/photos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          logout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized = data.map((p) => ({
            ...p,
            id: p._id || p.id,
            image: resolveImage(p.imageUrl || p.image),
            category: p.category || "My Photos",
            album: p.category || "My Photos",
            location: p.location || "",
            date: p.createdAt
              ? new Date(p.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently Added",
          }));
          setPhotos(normalized);
        }
      } catch (err) {
        console.warn("Could not fetch remote photos, using local dynamic photos:", err);
      } finally {
        setLoadingBackend(false);
      }
    };
    fetchPhotos();
  }, [token, logout]);

  /* ── Current User Avatar ── */
  const currentUserAvatar = user?.profilePicture
    ? resolveImage(user.profilePicture)
    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

  /* ── Full List of Categories & Albums ── */
  const allCategories = useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    customCategories.forEach((c) => {
      if (c && !list.some((item) => item.toLowerCase() === c.toLowerCase())) {
        list.push(c);
      }
    });
    photos.forEach((p) => {
      const cat = (p.category || p.album || "").trim();
      if (cat && !list.some((item) => item.toLowerCase() === cat.toLowerCase())) {
        list.push(cat);
      }
    });
    return list.filter((c) => !deletedCategories.some((d) => d.toLowerCase() === c.toLowerCase()));
  }, [customCategories, photos, deletedCategories]);

  /* ── 100% Dynamic Album Grouping from Photos ── */
  const albums = useMemo(() => {
    if (!photos.length) return [];

    const groups = {};
    photos.forEach((photo) => {
      const albumName = (photo.album || photo.category || "My Photos").trim();
      if (!groups[albumName]) {
        groups[albumName] = [];
      }
      groups[albumName].push(photo);
    });

    return Object.entries(groups).map(([albumName, items]) => {
      const latestPhoto = items[0];
      const location = items.find((p) => p.location)?.location || "";
      const author = latestPhoto.user?.username
        ? {
            name: latestPhoto.user.username,
            avatar: latestPhoto.user.profilePicture
              ? resolveImage(latestPhoto.user.profilePicture)
              : currentUserAvatar,
          }
        : {
            name: user?.username || "You",
            avatar: currentUserAvatar,
          };

      return {
        id: albumName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        title: albumName,
        date: latestPhoto.date || "Recently Updated",
        photoCount: items.length,
        location: location,
        author: author,
        featuredPhoto: latestPhoto,
        photos: items.slice(1),
        allItems: items,
      };
    });
  }, [photos, user, currentUserAvatar]);

  /* ── Complete Albums List for Albums Tab (Proper structure with "My Photos" always at the top) ── */
  const allAlbumsForTab = useMemo(() => {
    // 1. Primary "My Photos" album — ALWAYS Top (#1) with all user photos
    const myPhotosAlbum = {
      id: "my-photos",
      title: "My Photos",
      date: photos.length > 0 ? (photos[0].date || "Recently Updated") : "Ready for uploads",
      photoCount: photos.length,
      location: photos.find((p) => p.location)?.location || "",
      author: { name: user?.username || "You", avatar: currentUserAvatar },
      featuredPhoto: photos.length > 0 ? photos[0] : null,
      photos: photos.slice(1),
      allItems: photos,
      isPrimary: true,
      isCustom: false,
    };

    // 2. Active albums with photos (excluding "My Photos" which is already primary #1)
    const activeAlbums = albums.filter(
      (alb) =>
        alb.title.toLowerCase() !== "my photos" &&
        !deletedCategories.some((d) => d.toLowerCase() === alb.title.toLowerCase())
    );

    // 3. Other categories ready for uploads (ordered, without "My Photos" or duplicates)
    const emptyCategoryAlbums = [];
    allCategories.forEach((cat) => {
      const key = cat.toLowerCase();
      if (
        key !== "my photos" &&
        !activeAlbums.some((a) => a.title.toLowerCase() === key) &&
        !deletedCategories.some((d) => d.toLowerCase() === key)
      ) {
        emptyCategoryAlbums.push({
          id: cat.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          title: cat,
          date: "Ready for uploads",
          photoCount: 0,
          location: "",
          author: { name: user?.username || "You", avatar: currentUserAvatar },
          featuredPhoto: null,
          photos: [],
          allItems: [],
          isPrimary: false,
          isCustom: !DEFAULT_CATEGORIES.includes(cat),
        });
      }
    });

    // Structured: My Photos always top, followed by active folders with photos, then other category folders
    return [myPhotosAlbum, ...activeAlbums, ...emptyCategoryAlbums];
  }, [albums, allCategories, deletedCategories, photos, user, currentUserAvatar]);

  /* ── Modal Lightbox State ── */
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openPhotoModal = (photo) => {
    const idx = photos.findIndex((p) => p.id === photo.id);
    setSelectedPhoto(photo);
    setCurrentIndex(idx >= 0 ? idx : 0);
  };

  const closeModal = () => setSelectedPhoto(null);

  const nextPhoto = () => {
    if (!photos.length) return;
    const idx = (currentIndex + 1) % photos.length;
    setCurrentIndex(idx);
    setSelectedPhoto(photos[idx]);
  };

  const previousPhoto = () => {
    if (!photos.length) return;
    const idx = (currentIndex - 1 + photos.length) % photos.length;
    setCurrentIndex(idx);
    setSelectedPhoto(photos[idx]);
  };

  /* ── Handlers ── */
  const toggleFavorite = async (id, e) => {
    if (e) e.stopPropagation();
    const willBeFav = !favorites.includes(id);

    setFavorites((prev) =>
      willBeFav ? [...prev, id] : prev.filter((fid) => fid !== id)
    );

    if (token) {
      try {
        await fetch(`${BACKEND_URL}/api/photos/${id}/like`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Could not sync like with server:", err);
      }
    }
  };

  const handleAddPhoto = (newPhoto) => {
    const imageUrl = newPhoto.imageUrl || newPhoto.image;
    const cat = (newPhoto.category || "My Photos").trim();
    const normalized = {
      ...newPhoto,
      id: newPhoto._id || newPhoto.id || `photo_${Date.now()}`,
      image: resolveImage(imageUrl),
      category: cat,
      album: cat,
      location: newPhoto.location || "",
      date: "Just now",
      title: newPhoto.title || "Untitled",
      user: newPhoto.user || (user ? { username: user.username } : { username: "You" }),
    };

    setPhotos((prev) => [normalized, ...prev]);
    handleAddCategory(cat);
    setCreateModalOpen(false);
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/api/photos/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setFavorites((prev) => prev.filter((fid) => fid !== id));
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
  };

  /* ── Filtered Albums / Photos ── */
  const filteredAlbums = useMemo(() => {
    const q = search.trim().toLowerCase();

    // 1. Favorites collection
    if (selectedFilter === "Favorites") {
      const favPhotos = photos.filter((p) => favorites.includes(p.id));
      const filteredFavs = q
        ? favPhotos.filter((p) => {
            const matchTitle = p.title?.toLowerCase().includes(q);
            const matchDesc = p.description?.toLowerCase().includes(q);
            const matchCat = p.category?.toLowerCase().includes(q);
            const matchLoc = p.location?.toLowerCase().includes(q);
            const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
            return matchTitle || matchDesc || matchCat || matchLoc || matchTags;
          })
        : favPhotos;

      if (!filteredFavs.length) return [];
      return [
        {
          id: "favorites-collection",
          title: "Favorites",
          date: filteredFavs[0]?.date || "Recently Liked",
          photoCount: filteredFavs.length,
          location: "",
          author: { name: user?.username || "You", avatar: currentUserAvatar },
          featuredPhoto: filteredFavs[0],
          photos: filteredFavs.slice(1),
          allItems: filteredFavs,
        },
      ];
    }

    // 2. "My Photos" collection — ALWAYS shows all user's photos when opened
    if (selectedFilter.toLowerCase() === "my photos") {
      const myPhotosList = q
        ? photos.filter((p) => {
            const matchTitle = p.title?.toLowerCase().includes(q);
            const matchDesc = p.description?.toLowerCase().includes(q);
            const matchCat = p.category?.toLowerCase().includes(q);
            const matchLoc = p.location?.toLowerCase().includes(q);
            const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
            return matchTitle || matchDesc || matchCat || matchLoc || matchTags;
          })
        : photos;

      if (!myPhotosList.length) return [];
      return [
        {
          id: "my-photos",
          title: "My Photos",
          date: myPhotosList[0]?.date || "Recently Updated",
          photoCount: myPhotosList.length,
          location: myPhotosList.find((p) => p.location)?.location || "",
          author: { name: user?.username || "You", avatar: currentUserAvatar },
          featuredPhoto: myPhotosList[0],
          photos: myPhotosList.slice(1),
          allItems: myPhotosList,
        },
      ];
    }

    // 3. All Photos or specific category album
    return albums
      .map((album) => {
        if (
          selectedFilter !== "All Photos" &&
          album.title.toLowerCase() !== selectedFilter.toLowerCase()
        ) {
          return null;
        }

        // Search query
        if (q) {
          const matching = album.allItems.filter((p) => {
            const matchTitle = p.title?.toLowerCase().includes(q);
            const matchDesc = p.description?.toLowerCase().includes(q);
            const matchCat = p.category?.toLowerCase().includes(q);
            const matchLoc = p.location?.toLowerCase().includes(q);
            const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
            return matchTitle || matchDesc || matchCat || matchLoc || matchTags;
          });

          if (!matching.length) return null;

          return {
            ...album,
            photoCount: matching.length,
            featuredPhoto: matching[0],
            photos: matching.slice(1),
          };
        }

        return album;
      })
      .filter(Boolean);
  }, [albums, photos, selectedFilter, search, favorites, user, currentUserAvatar]);

  /* ── Continuous Photo Store Stream (Matching 5-Column Grid Structure) ── */
  const displayedPhotos = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = photos;

    if (selectedFilter === "Favorites") {
      list = photos.filter((p) => favorites.includes(p.id));
    } else if (selectedFilter === "All Photos") {
      list = photos;
    } else {
      list = photos.filter(
        (p) => (p.category || p.album || "").trim().toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    if (q) {
      list = list.filter((p) => {
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchLoc = p.location?.toLowerCase().includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchCat || matchLoc || matchTags;
      });
    }

    return list;
  }, [photos, selectedFilter, favorites, search]);

  /* Close dropdowns on outside click */
  const topbarRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`nd-app-root ${darkMode ? "nd-dark" : "nd-light"}`}>
      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className={`nd-sidebar ${mobileSidebarOpen ? "nd-sidebar--open" : ""}`}>
        <div className="nd-sidebar-inner">
          {/* Logo Brand Header */}
          <div className="nd-sidebar-logo">
            <img src="/logo.png" alt="Photo Gallery Logo" className="nd-logo-img" />
            <span className="nd-logo-text">PhotoGallery</span>
          </div>

          {/* Top: Create New / Add Photo Pill Button */}
          <div className="nd-create-wrap">
            <button
              className="nd-create-btn"
              onClick={() => {
                setCreateModalInitialCategory(
                  selectedFilter !== "All Photos" && selectedFilter !== "Favorites"
                    ? selectedFilter
                    : "My Photos"
                );
                setCreateModalOpen(true);
              }}
              type="button"
              id="btn-create-new"
            >
              <span className="nd-btn-plus">+</span> Add Photo
            </button>
          </div>

          {/* Section Header */}
          <div className="nd-nav-section-title">MENU</div>

          {/* Navigation Links */}
          <nav className="nd-nav">
            <button
              className={`nd-nav-item ${activeTab === "Photos" && selectedFilter === "All Photos" ? "nd-nav-item--active" : ""}`}
              onClick={() => {
                setSelectedFilter("All Photos");
                setActiveTab("Photos");
                setMobileSidebarOpen(false);
              }}
              type="button"
            >
              <span className="nd-nav-icon">🖼️</span>
              All Photos
            </button>
            <button
              className={`nd-nav-item ${activeTab === "Albums" ? "nd-nav-item--active" : ""}`}
              onClick={() => {
                setActiveTab("Albums");
                setMobileSidebarOpen(false);
              }}
              type="button"
            >
              <span className="nd-nav-icon">📁</span>
              All Albums ({allAlbumsForTab.length})
            </button>
            <button
              className={`nd-nav-item ${activeTab === "Photos" && selectedFilter === "Favorites" ? "nd-nav-item--active" : ""}`}
              onClick={() => {
                setSelectedFilter("Favorites");
                setActiveTab("Photos");
                setMobileSidebarOpen(false);
              }}
              type="button"
            >
              <span className="nd-nav-icon">❤️</span>
              Favorites {favorites.length > 0 ? `(${favorites.length})` : ""}
            </button>
            <button
              className={`nd-nav-item ${activeTab === "Settings" ? "nd-nav-item--active" : ""}`}
              onClick={() => {
                setProfileOpen(true);
                setMobileSidebarOpen(false);
              }}
              type="button"
            >
              <span className="nd-nav-icon">⚙️</span>
              Settings
            </button>
          </nav>

          {/* ── FOLDERS (LINE BY LINE IN SIDEBAR MENU) ── */}
          <div className="nd-nav-section-header-row">
            <div className="nd-nav-section-title" style={{ margin: 0 }}>FOLDERS</div>
            <button
              className="nd-sidebar-add-cat-btn"
              onClick={() => setAlbumModalOpen(true)}
              title="Create New Folder/Album"
              type="button"
            >
              +
            </button>
          </div>

          <div className="nd-sidebar-folder-list">
            {allCategories.map((cat) => {
              const albumItem = allAlbumsForTab.find((a) => a.title.toLowerCase() === cat.toLowerCase());
              const count = albumItem ? albumItem.photoCount : 0;
              const isSelected = activeTab === "Photos" && selectedFilter.toLowerCase() === cat.toLowerCase();

              return (
                <div key={cat} className="nd-sidebar-folder-row">
                  <button
                    className={`nd-sidebar-folder-item ${isSelected ? "nd-sidebar-folder-item--active" : ""}`}
                    onClick={() => {
                      setSelectedFilter(cat);
                      setActiveTab("Photos");
                      setMobileSidebarOpen(false);
                    }}
                    type="button"
                  >
                    <span className="nd-folder-icon">📁</span>
                    <span className="nd-folder-name" title={cat}>{cat}</span>
                    {count > 0 && <span className="nd-folder-count-pill">{count}</span>}
                  </button>
                </div>
              );
            })}

            <button
              className="nd-sidebar-create-folder-btn"
              onClick={() => setAlbumModalOpen(true)}
              type="button"
            >
              <span className="nd-folder-icon">+</span>
              <span className="nd-folder-name">Create New Album...</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="nd-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────── */}
      <main className="nd-main">
        {/* Top Header Bar */}
        <header className="nd-topbar" ref={topbarRef}>
          {/* Mobile hamburger button */}
          <button
            className="nd-hamburger-btn"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle navigation menu"
            type="button"
          >
            ☰
          </button>

          <div className="nd-topbar-spacer" />

          {/* Right Controls: Search, Bell, User Avatar */}
          <div className="nd-topbar-controls">
            {/* Search Input */}
            <div className="nd-search-box">
              <span className="nd-search-icon">🔍</span>
              <input
                type="text"
                className="nd-search-input"
                placeholder="Search photos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-input"
              />
              {search && (
                <button
                  className="nd-search-clear"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Animated Day / Night Switch */}
            <ThemeToggleSwitch
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              size="sm"
            />

            {/* Notification Bell */}
            <div className="nd-popover-anchor">
              <button
                className={`nd-icon-btn ${notificationsOpen ? "nd-icon-btn--active" : ""}`}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserMenuOpen(false);
                }}
                title="Notifications"
                type="button"
                id="notifications-bell"
              >
                <span className="nd-bell-icon">🔔</span>
                {photos.length > 0 && <span className="nd-bell-dot" />}
              </button>

              {notificationsOpen && (
                <div className="nd-dropdown-menu nd-dropdown-notifications">
                  <div className="nd-dropdown-header">
                    <h4>Notifications</h4>
                    <span className="nd-badge-count">{photos.length > 0 ? "Active" : "0"}</span>
                  </div>
                  <div className="nd-notifications-list">
                    {photos.length > 0 ? (
                      <div className="nd-notification-item unread">
                        <p className="nd-notif-text">
                          You have {photos.length} photo{photos.length !== 1 ? "s" : ""} synced in your dynamic gallery.
                        </p>
                        <span className="nd-notif-time">Just now</span>
                      </div>
                    ) : (
                      <div className="nd-notification-item">
                        <p className="nd-notif-text">Welcome to your new photo gallery! Click Add Photo to upload your first image.</p>
                        <span className="nd-notif-time">Today</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown */}
            <div className="nd-popover-anchor">
              <button
                className="nd-avatar-btn"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotificationsOpen(false);
                }}
                aria-label="User profile menu"
                type="button"
                id="user-profile-avatar-btn"
              >
                <img
                  src={currentUserAvatar}
                  alt={user?.username || "Guest"}
                  className="nd-avatar-img"
                />
              </button>

              {userMenuOpen && (
                <div className="nd-dropdown-menu nd-dropdown-profile">
                  <div className="nd-profile-summary">
                    <img
                      src={currentUserAvatar}
                      alt={user?.username || "Guest"}
                      className="nd-summary-avatar"
                    />
                    <div className="nd-summary-info">
                      <span className="nd-summary-name">{user?.username || "Guest User"}</span>
                      <span className="nd-summary-email">{user?.email || "Local Dynamic Gallery"}</span>
                    </div>
                  </div>
                  <div className="nd-menu-divider" />
                  <button
                    className="nd-menu-item"
                    onClick={() => {
                      setProfileOpen(true);
                      setUserMenuOpen(false);
                    }}
                    type="button"
                  >
                    👤 My Profile
                  </button>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--nd-sidebar-border)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--nd-text-main)" }}>
                      {darkMode ? "Night Mode" : "Day Mode"}
                    </span>
                    <ThemeToggleSwitch
                      darkMode={darkMode}
                      toggleDarkMode={toggleDarkMode}
                      size="sm"
                    />
                  </div>
                  {onGoToLanding && (
                    <button
                      className="nd-menu-item"
                      onClick={() => {
                        onGoToLanding();
                        setUserMenuOpen(false);
                      }}
                      type="button"
                    >
                      🏠 Landing Page
                    </button>
                  )}
                  <div className="nd-menu-divider" />
                  {token ? (
                    <button
                      className="nd-menu-item nd-menu-item--danger"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      type="button"
                    >
                      🚪 Sign Out
                    </button>
                  ) : (
                    <button
                      className="nd-menu-item"
                      onClick={() => {
                        setProfileOpen(true);
                        setUserMenuOpen(false);
                      }}
                      type="button"
                    >
                      🔑 Sign In / Register
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── TAB CONTENT: PHOTOS ──────────────────────── */}
        {activeTab === "Photos" && (
          <div className="nd-content-wrap">
            {/* Top Dropdown Filter: All Photos ▾ */}
            <div className="nd-title-row" ref={filterDropdownRef}>
              <div className="nd-dropdown-anchor">
                <button
                  className="nd-title-dropdown-btn"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  type="button"
                  id="filter-dropdown-toggle"
                  aria-expanded={filterDropdownOpen}
                >
                  <h1 className="nd-view-title">{selectedFilter}</h1>
                  <span className="nd-dropdown-chevron">▾</span>
                </button>

                {filterDropdownOpen && (
                  <div className="nd-dropdown-menu nd-dropdown-filter">
                    {/* All Photos & Favorites */}
                    <button
                      className={`nd-filter-option ${selectedFilter === "All Photos" ? "nd-filter-option--active" : ""}`}
                      onClick={() => {
                        setSelectedFilter("All Photos");
                        setFilterDropdownOpen(false);
                      }}
                      type="button"
                    >
                      All Photos
                    </button>
                    <button
                      className={`nd-filter-option ${selectedFilter === "Favorites" ? "nd-filter-option--active" : ""}`}
                      onClick={() => {
                        setSelectedFilter("Favorites");
                        setFilterDropdownOpen(false);
                      }}
                      type="button"
                    >
                      ❤️ Favorites ({favorites.length})
                    </button>

                    <div className="nd-dropdown-divider" />

                    {/* All Categories / Albums: My Photos, Nature, Travel, etc. */}
                    {allCategories.map((cat) => {
                      const isSelected = selectedFilter.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          className={`nd-filter-option ${isSelected ? "nd-filter-option--active" : ""}`}
                          onClick={() => {
                            setSelectedFilter(cat);
                            setFilterDropdownOpen(false);
                          }}
                          type="button"
                        >
                          {cat}
                        </button>
                      );
                    })}

                    <div className="nd-dropdown-divider" />

                    {/* + Create New Album... */}
                    <button
                      className="nd-filter-option nd-filter-create-option"
                      onClick={() => {
                        setFilterDropdownOpen(false);
                        setAlbumModalOpen(true);
                      }}
                      type="button"
                    >
                      + Create New Album...
                    </button>
                  </div>
                )}
              </div>

              {/* Photos Counter & Folder Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {selectedFilter !== "All Photos" &&
                  selectedFilter !== "Favorites" &&
                  selectedFilter.toLowerCase() !== "my photos" && (
                    <button
                      type="button"
                      className="nd-title-action-btn--danger"
                      onClick={() => onRequestDeleteFolder(selectedFilter)}
                      title={`Delete folder "${selectedFilter}"`}
                    >
                      🗑️ Delete Folder
                    </button>
                  )}
                <span className="nd-total-count">
                  {displayedPhotos.length} photo{displayedPhotos.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Folder Navigation Banner when a specific folder is selected */}
            {selectedFilter !== "All Photos" && selectedFilter !== "Favorites" && (
              <div className="nd-folder-banner">
                <div className="nd-folder-banner-left">
                  <button
                    type="button"
                    className="nd-folder-back-btn"
                    onClick={() => setActiveTab("Albums")}
                    title="Back to All Albums"
                  >
                    ← Back to Albums
                  </button>
                  <div className="nd-folder-banner-info">
                    <h2 className="nd-folder-banner-title">📁 {selectedFilter}</h2>
                    <span className="nd-folder-banner-count">
                      {displayedPhotos.length} photo(s)
                    </span>
                  </div>
                </div>

                <div className="nd-folder-banner-actions">
                  <button
                    type="button"
                    className="nd-create-btn"
                    style={{ width: "auto", padding: "8px 16px", fontSize: "13px" }}
                    onClick={() => {
                      setCreateModalInitialCategory(selectedFilter);
                      setCreateModalOpen(true);
                    }}
                  >
                    ➕ Add Photo
                  </button>
                  {selectedFilter.toLowerCase() !== "my photos" && (
                    <button
                      type="button"
                      className="nd-title-action-btn--danger"
                      onClick={() => onRequestDeleteFolder(selectedFilter)}
                      title={`Delete folder "${selectedFilter}"`}
                    >
                      🗑️ Delete Folder
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Empty State when NO photos exist at all */}
            {photos.length === 0 ? (
              <div className="nd-empty-state">
                <div className="nd-empty-icon">
                  <PhotoKeeperMascot size={72} />
                </div>
                <h3>Your Photo Gallery is Empty</h3>
                <p>
                  Upload your first photo to start your dynamic gallery. Your photos will automatically organize into
                  custom albums and categories.
                </p>
                <button
                  className="nd-create-btn"
                  style={{ width: "auto", padding: "12px 28px", marginTop: "12px" }}
                  onClick={() => {
                    setCreateModalInitialCategory(selectedFilter !== "All Photos" && selectedFilter !== "Favorites" ? selectedFilter : "My Photos");
                    setCreateModalOpen(true);
                  }}
                  type="button"
                >
                  ➕ Upload Your First Photo
                </button>
              </div>
            ) : displayedPhotos.length === 0 ? (
              <div className="nd-empty-state">
                <div className="nd-empty-icon">
                  {search ? "🔍" : selectedFilter === "Favorites" ? "❤️" : "📁"}
                </div>
                <h3>
                  {search
                    ? "No matching photos"
                    : selectedFilter === "Favorites"
                    ? "No favorites yet"
                    : `No photos in "${selectedFilter}"`}
                </h3>
                <p>
                  {search
                    ? `No photos matched "${search}".`
                    : selectedFilter === "Favorites"
                    ? "Click the heart icon on any photo to save it to your favorites."
                    : `This album / category currently has no photos. Add your first photo to "${selectedFilter}"!`}
                </p>
                {selectedFilter !== "Favorites" && !search ? (
                  <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      className="nd-create-btn"
                      style={{ width: "auto", padding: "12px 28px" }}
                      onClick={() => {
                        setCreateModalInitialCategory(selectedFilter === "All Photos" ? "My Photos" : selectedFilter);
                        setCreateModalOpen(true);
                      }}
                      type="button"
                    >
                      ➕ Add Photo to {selectedFilter}
                    </button>
                    {selectedFilter !== "All Photos" && selectedFilter.toLowerCase() !== "my photos" && (
                      <button
                        className="nd-empty-state-delete-btn"
                        onClick={() => onRequestDeleteFolder(selectedFilter)}
                        type="button"
                      >
                        🗑️ Delete This Folder
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    className="nd-create-btn"
                    style={{ width: "auto", padding: "10px 24px", marginTop: "12px" }}
                    onClick={() => {
                      setSelectedFilter("All Photos");
                      setSearch("");
                    }}
                    type="button"
                  >
                    View All Photos
                  </button>
                )}
              </div>
            ) : (
              /* Photo Store Mosaic Grid Structure (Matching Reference 5-Column Grid) */
              <div className="nd-mosaic-grid">
                {displayedPhotos.map((photo, index) => {
                  const isLiked = favorites.includes(photo.id);
                  // Feature card at index 13 (rows 3-4 cols 4-5) or if explicitly marked
                  const isFeatureCard = photo.isFeatured || (displayedPhotos.length >= 14 && index % 17 === 13);
                  const isVideo = Boolean(photo.videoUrl || photo.isVideo);

                  return (
                    <div
                      key={photo.id || `photo_${index}`}
                      className={`nd-grid-card ${isFeatureCard ? "nd-grid-card--feature" : ""}`}
                      onClick={() => openPhotoModal(photo)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="nd-grid-card-inner">
                        <img
                          src={photo.image || photo.imageUrl}
                          alt={photo.title || "Photo"}
                          className="nd-card-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
                          }}
                        />

                        {/* Video indicator badge */}
                        {isVideo && (
                          <div className="nd-card-video-pill">
                            <span>▶</span> Video
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="nd-card-overlay">
                          <div className="nd-card-overlay-top">
                            <span className="nd-card-badge">
                              {photo.category || "My Photos"}
                            </span>
                            <button
                              className={`nd-like-btn ${isLiked ? "liked" : ""}`}
                              onClick={(e) => toggleFavorite(photo.id, e)}
                              title={isLiked ? "Remove favorite" : "Add to favorites"}
                              type="button"
                              aria-label={isLiked ? "Unlike photo" : "Like photo"}
                            >
                              {isLiked ? "❤️" : "🤍"}
                            </button>
                          </div>

                          <div className="nd-card-overlay-bottom">
                            <div className="nd-card-info">
                              <span className="nd-card-title">{photo.title || "Untitled"}</span>
                              {photo.location && (
                                <span className="nd-card-location">📍 {photo.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: ALBUMS ───────────────────────── */}
        {activeTab === "Albums" && (
          <div className="nd-content-wrap">
            <div className="nd-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h1 className="nd-view-title" style={{ display: "inline-block", margin: 0 }}>
                  Albums &amp; Folders
                </h1>
                <span className="nd-total-count">{allAlbumsForTab.length} folders</span>
                {deletedCategories.length > 0 && (
                  <button
                    type="button"
                    className="nd-restore-btn"
                    onClick={handleRestoreCategories}
                    title="Restore all default folders"
                  >
                    ↺ Restore Folders ({deletedCategories.length})
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* View Mode Toggle: Line by Line vs Grid */}
                <div className="nd-view-mode-toggle">
                  <button
                    type="button"
                    className={`nd-toggle-view-btn ${albumsViewMode === "list" ? "active" : ""}`}
                    onClick={() => handleSetAlbumsViewMode("list")}
                    title="Line by Line (List View)"
                  >
                    ☰ Line by Line
                  </button>
                  <button
                    type="button"
                    className={`nd-toggle-view-btn ${albumsViewMode === "grid" ? "active" : ""}`}
                    onClick={() => handleSetAlbumsViewMode("grid")}
                    title="Grid View"
                  >
                    ⊞ Grid
                  </button>
                </div>

                <button
                  className="nd-create-btn"
                  style={{ width: "auto", padding: "8px 18px", fontSize: "13.5px" }}
                  onClick={() => setAlbumModalOpen(true)}
                  type="button"
                >
                  <span className="nd-btn-plus">+</span> Create New Album
                </button>
              </div>
            </div>

            {allAlbumsForTab.length === 0 ? (
              <div className="nd-empty-state">
                <div className="nd-empty-icon">📁</div>
                <h3>No Albums Created Yet</h3>
                <p>
                  Create custom albums or categories to organize your photos.
                </p>
                <button
                  className="nd-create-btn"
                  style={{ width: "auto", padding: "12px 28px", marginTop: "12px" }}
                  onClick={() => setAlbumModalOpen(true)}
                  type="button"
                >
                  ➕ Create First Album
                </button>
              </div>
            ) : albumsViewMode === "list" ? (
              /* Line by Line (List View) — Proper Structure with "My Photos" Always on Top */
              <div className="nd-folders-line-container">
                {allAlbumsForTab.map((album) => (
                  <div
                    key={album.id}
                    className={`nd-folder-line-item ${album.isPrimary ? "nd-folder-line-item--primary" : ""}`}
                    onClick={() => {
                      setSelectedFilter(album.title);
                      setActiveTab("Photos");
                    }}
                  >
                    <div className="nd-fli-left">
                      <div className="nd-fli-icon-wrap">
                        {album.featuredPhoto?.image || album.photos?.[0]?.image ? (
                          <img
                            src={album.featuredPhoto?.image || album.photos?.[0]?.image}
                            alt={album.title}
                            className="nd-fli-thumb"
                          />
                        ) : (
                          <span className="nd-fli-category-icon">
                            {getCategoryIcon(album.title)}
                          </span>
                        )}
                      </div>
                      <div className="nd-fli-info">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="nd-fli-title">{album.title}</span>
                          {album.isPrimary && (
                            <span className="nd-fli-primary-pill">⭐ Primary Collection</span>
                          )}
                        </div>
                        <span className="nd-fli-subtitle">
                          {album.photoCount > 0
                            ? `${album.photoCount} Photo${album.photoCount !== 1 ? "s" : ""} · Updated ${album.date}`
                            : "Ready for uploads"}
                        </span>
                      </div>
                    </div>

                    <div className="nd-fli-right" onClick={(e) => e.stopPropagation()}>
                      <span className={`nd-fli-badge ${album.photoCount > 0 ? "has-photos" : ""}`}>
                        {album.photoCount} Photo{album.photoCount !== 1 ? "s" : ""}
                      </span>
                      <button
                        type="button"
                        className="nd-fli-action-btn"
                        onClick={() => {
                          setCreateModalInitialCategory(album.title);
                          setCreateModalOpen(true);
                        }}
                      >
                        <span style={{ fontWeight: "700", marginRight: "3px" }}>+</span> Add Photo
                      </button>
                      <button
                        type="button"
                        className="nd-fli-open-btn"
                        onClick={() => {
                          setSelectedFilter(album.title);
                          setActiveTab("Photos");
                        }}
                      >
                        Open →
                      </button>
                      {!album.isPrimary && album.title.toLowerCase() !== "my photos" && (
                        <button
                          type="button"
                          className="nd-fli-delete-btn"
                          title={`Delete folder "${album.title}"`}
                          onClick={() => onRequestDeleteFolder(album.title)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid View — Proper Structure with "My Photos" Always on Top */
              <div className="nd-albums-grid">
                {allAlbumsForTab.map((album) => (
                  <div
                    key={album.id}
                    className={`nd-album-card ${album.isPrimary ? "nd-album-card--primary" : ""}`}
                    onClick={() => {
                      setSelectedFilter(album.title);
                      setActiveTab("Photos");
                    }}
                  >
                    <div className="nd-album-cover">
                      {album.featuredPhoto?.image || album.photos?.[0]?.image ? (
                        <img
                          src={album.featuredPhoto?.image || album.photos?.[0]?.image}
                          alt={album.title}
                          className="nd-album-img"
                        />
                      ) : (
                        <div className="nd-album-cover-empty">
                          <span className="nd-empty-album-icon">{getCategoryIcon(album.title)}</span>
                          <span className="nd-empty-album-text">{album.title}</span>
                        </div>
                      )}
                      {!album.isPrimary && album.title.toLowerCase() !== "my photos" && (
                        <button
                          type="button"
                          className="nd-album-card-delete-btn"
                          title={`Delete folder "${album.title}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteFolder(album.title);
                          }}
                        >
                          🗑️
                        </button>
                      )}
                      <span className="nd-album-badge">
                        {album.photoCount} Photo{album.photoCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="nd-album-info">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 className="nd-album-title" style={{ margin: 0 }}>{album.title}</h3>
                          {album.isPrimary && (
                            <span className="nd-fli-primary-pill" style={{ fontSize: "10px", padding: "2px 7px" }}>
                              ⭐ Primary
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="nd-album-add-photo-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreateModalInitialCategory(album.title);
                              setCreateModalOpen(true);
                            }}
                          >
                            + Add Photo
                          </button>
                          {!album.isPrimary && album.title.toLowerCase() !== "my photos" && (
                            <button
                              type="button"
                              className="nd-album-card-del-link-btn"
                              title={`Delete folder "${album.title}"`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteFolder(album.title);
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="nd-album-sub">{album.location || album.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── CREATE NEW ALBUM / CATEGORY MODAL ───────────────── */}
      {albumModalOpen && (
        <div className="nd-modal-overlay" onClick={() => setAlbumModalOpen(false)}>
          <div className="nd-create-modal nd-album-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nd-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>📁</span>
                <div>
                  <h3 style={{ margin: 0 }}>Create New Album / Category</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--nd-text-muted)" }}>
                    Add a custom album to your menu &amp; organize photos
                  </p>
                </div>
              </div>
              <button
                className="nd-modal-close"
                onClick={() => setAlbumModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => handleCreateAlbumSubmit(e, false)} className="ap-form" style={{ padding: "20px 24px" }}>
              <div className="ap-field ap-field-full">
                <label className="ap-label" htmlFor="new-album-name">
                  📁 Album / Category Name <span className="ap-required">*</span>
                </label>
                <input
                  id="new-album-name"
                  type="text"
                  className="ap-input"
                  placeholder="e.g. Hawaii Trip 2026, Wedding, Street Art…"
                  value={newAlbumName}
                  onChange={(e) => {
                    setNewAlbumName(e.target.value);
                    if (albumModalError) setAlbumModalError("");
                  }}
                  autoFocus
                  maxLength={50}
                />
              </div>

              {albumModalError && (
                <div className="ap-error" style={{ marginBottom: "14px" }}>
                  ⚠️ {albumModalError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="nd-create-btn"
                  style={{
                    width: "auto",
                    padding: "9px 16px",
                    background: "transparent",
                    color: "var(--nd-text-main)",
                    border: "1px solid var(--nd-sidebar-border)",
                    boxShadow: "none"
                  }}
                  onClick={() => setAlbumModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="nd-create-btn"
                  style={{ width: "auto", padding: "9px 18px", fontSize: "13.5px" }}
                >
                  📁 Create Album
                </button>
                <button
                  type="button"
                  className="nd-create-btn nd-create-btn--highlight"
                  style={{
                    width: "auto",
                    padding: "9px 18px",
                    fontSize: "13.5px",
                    background: "var(--nd-primary-dark, #004724)"
                  }}
                  onClick={(e) => handleCreateAlbumSubmit(e, true)}
                >
                  ➕ Create &amp; Add Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE NEW PHOTO MODAL ───────────────────────── */}
      {createModalOpen && (
        <div className="nd-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="nd-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nd-modal-header">
              <h3>Upload Photo</h3>
              <button
                className="nd-modal-close"
                onClick={() => setCreateModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="nd-modal-body">
              <AddPhoto
                onAddPhoto={handleAddPhoto}
                customCategories={customCategories}
                categories={allCategories}
                onAddCategory={handleAddCategory}
                initialCategory={createModalInitialCategory}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE FOLDER CONFIRMATION MODAL ──────────────── */}
      {deleteFolderTarget && (
        <div className="nd-modal-overlay" onClick={() => setDeleteFolderTarget(null)}>
          <div className="nd-create-modal nd-delete-folder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nd-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, color: "#ef4444" }}>Delete Folder</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--nd-text-muted)" }}>
                    Folder: <strong>"{deleteFolderTarget.title}"</strong>
                  </p>
                </div>
              </div>
              <button
                className="nd-modal-close"
                onClick={() => setDeleteFolderTarget(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 16px", fontSize: "14px", lineHeight: "1.5", color: "var(--nd-text-main)" }}>
                This folder currently contains <strong>{deleteFolderTarget.photoCount}</strong> photo{deleteFolderTarget.photoCount !== 1 ? "s" : ""}.
                What would you like to do with the photos?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="nd-delete-option-btn nd-delete-option-btn--keep"
                  onClick={() => performDeleteFolder(deleteFolderTarget.title, "move")}
                >
                  <div style={{ fontSize: "20px" }}>📁</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "600", fontSize: "13.5px" }}>Keep Photos (Move to "My Photos")</div>
                    <div style={{ fontSize: "11.5px", opacity: 0.85 }}>Delete only the folder. Photos remain safe in your gallery.</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="nd-delete-option-btn nd-delete-option-btn--delete"
                  onClick={() => performDeleteFolder(deleteFolderTarget.title, "delete")}
                >
                  <div style={{ fontSize: "20px" }}>🗑️</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "600", fontSize: "13.5px" }}>Delete Folder &amp; All {deleteFolderTarget.photoCount} Photo(s)</div>
                    <div style={{ fontSize: "11.5px", opacity: 0.85 }}>Permanently deletes both the folder and its photos.</div>
                  </div>
                </button>

                <button
                  type="button"
                  style={{ marginTop: "6px", padding: "8px 16px", alignSelf: "center", border: "none", background: "none", cursor: "pointer", color: "var(--nd-text-muted)", fontSize: "13px" }}
                  onClick={() => setDeleteFolderTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE MODAL ─────────────────────────────────── */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* ── IMAGE LIGHTBOX MODAL ─────────────────────────── */}
      <ImageModal
        photo={selectedPhoto}
        photos={photos}
        currentIndex={currentIndex}
        closeModal={closeModal}
        nextPhoto={nextPhoto}
        previousPhoto={previousPhoto}
        favorites={favorites}
        toggleFavorite={(id) => toggleFavorite(id)}
        onDeletePhoto={handleDeletePhoto}
      />
    </div>
  );
}

export default Dashboard;
