import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL, resolveImageUrl as resolveImage } from "../config";

import AddPhoto from "./AddPhoto";
import ImageModal from "./ImageModal";
import ProfileModal from "./ProfileModal";
import PhotoKeeperMascot from "./PhotoKeeperMascot";
import "./NewDashboard.css";

function Dashboard({ darkMode, toggleDarkMode, onGoToLanding }) {
  const { user, token, logout } = useAuth();

  /* ── Modals & Drawers ── */
  const [profileOpen, setProfileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* ── Active sidebar tab & filters ── */
  const [activeTab, setActiveTab] = useState("Photos"); // 'Photos' | 'Albums' | 'Locations' | 'Friends' | 'Settings'
  const [selectedFilter, setSelectedFilter] = useState("All Photos");
  const [search, setSearch] = useState("");

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

  /* ── 100% Dynamic Photos (Loaded from backend or dynamic localStorage) ── */
  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem("dynamic_photos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
    const normalized = {
      ...newPhoto,
      id: newPhoto._id || newPhoto.id || `photo_${Date.now()}`,
      image: resolveImage(imageUrl),
      category: newPhoto.category || "My Photos",
      album: newPhoto.category || "My Photos",
      location: newPhoto.location || "",
      date: "Just now",
      title: newPhoto.title || "Untitled",
      user: newPhoto.user || (user ? { username: user.username } : { username: "You" }),
    };

    setPhotos((prev) => [normalized, ...prev]);
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

    return albums
      .map((album) => {
        // Filter by top dropdown
        if (selectedFilter === "Favorites") {
          const matching = album.allItems.filter((p) => favorites.includes(p.id));
          if (!matching.length) return null;
          return {
            ...album,
            photoCount: matching.length,
            featuredPhoto: matching[0],
            photos: matching.slice(1),
          };
        }

        if (selectedFilter !== "All Photos" && album.title !== selectedFilter) {
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
  }, [albums, selectedFilter, search, favorites]);

  /* Close dropdowns on outside click */
  const topbarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
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
            <div className="nd-logo-icon">📸</div>
            <span className="nd-logo-text">PhotoGallery</span>
          </div>

          {/* Top: Create New / Add Photo Pill Button */}
          <div className="nd-create-wrap">
            <button
              className="nd-create-btn"
              onClick={() => setCreateModalOpen(true)}
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
              className={`nd-nav-item ${activeTab === "Photos" ? "nd-nav-item--active" : ""}`}
              onClick={() => {
                setActiveTab("Photos");
                setMobileSidebarOpen(false);
              }}
              type="button"
            >
              <span className="nd-nav-icon">🖼️</span>
              Photos
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
              Albums
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
                        <p className="nd-notif-text">Welcome to your new photo gallery! Click Create New to add your first photo.</p>
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
                type="button"
                id="user-menu-avatar"
              >
                <img
                  src={currentUserAvatar}
                  alt={user?.username || "User"}
                  className="nd-avatar-img"
                />
              </button>

              {userMenuOpen && (
                <div className="nd-dropdown-menu nd-dropdown-user">
                  <div className="nd-user-info-block">
                    <img src={currentUserAvatar} alt="avatar" className="nd-user-info-avatar" />
                    <div>
                      <p className="nd-user-info-name">{user?.username || "Active User"}</p>
                      <p className="nd-user-info-email">{user?.email || "personal@gallery.com"}</p>
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
                    👤 Profile Settings
                  </button>
                  <button
                    className="nd-menu-item"
                    onClick={() => {
                      toggleDarkMode();
                      setUserMenuOpen(false);
                    }}
                    type="button"
                  >
                    {darkMode ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}
                  </button>
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
                  {user ? (
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
            <div className="nd-title-row">
              <div className="nd-dropdown-anchor">
                <button
                  className="nd-title-dropdown-btn"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  type="button"
                  id="filter-dropdown-toggle"
                >
                  <h1 className="nd-view-title">{selectedFilter}</h1>
                  <span className="nd-dropdown-chevron">▾</span>
                </button>

                {filterDropdownOpen && (
                  <div className="nd-dropdown-menu nd-dropdown-filter">
                    {["All Photos", "Favorites", ...albums.map((a) => a.title)].map((item) => (
                      <button
                        key={item}
                        className={`nd-filter-option ${selectedFilter === item ? "nd-filter-option--active" : ""}`}
                        onClick={() => {
                          setSelectedFilter(item);
                          setFilterDropdownOpen(false);
                        }}
                        type="button"
                      >
                        {item === "Favorites" ? "❤️ Favorites" : item}
                        {item === "Favorites" && ` (${favorites.length})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Counter */}
              <span className="nd-total-count">
                {photos.length} total photo{photos.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* 100% Dynamic Empty State when NO photos exist */}
            {photos.length === 0 ? (
              <div className="nd-empty-state">
                <div className="nd-empty-icon">
                  <PhotoKeeperMascot size={72} />
                </div>
                <h3>Your Photo Gallery is Empty</h3>
                <p>
                  All mock data has been cleared! Upload your first photo to start your dynamic
                  gallery. Your photos will automatically organize into custom albums, locations,
                  and mosaic views.
                </p>
                <button
                  className="nd-create-btn"
                  style={{ width: "auto", padding: "12px 28px", marginTop: "12px" }}
                  onClick={() => setCreateModalOpen(true)}
                  type="button"
                >
                  ➕ Upload Your First Photo
                </button>
              </div>
            ) : filteredAlbums.length === 0 ? (
              /* Empty state after search / filter */
              <div className="nd-empty-state">
                <div className="nd-empty-icon">📷</div>
                <h3>No matching photos</h3>
                <p>
                  {search
                    ? `No matching results for "${search}". Try another keyword.`
                    : selectedFilter === "Favorites"
                    ? "No favorite photos yet. Click the heart icon on any photo to add it to your favorites."
                    : "No photos found in this album."}
                </p>
                <button
                  className="nd-reset-btn"
                  onClick={() => {
                    setSearch("");
                    setSelectedFilter("All Photos");
                  }}
                  type="button"
                >
                  View All Photos
                </button>
              </div>
            ) : (
              /* Grouped Dynamic Album Sections */
              <div className="nd-sections-container">
                {filteredAlbums.map((album) => {
                  const featured = album.featuredPhoto;
                  const isFeaturedLiked = featured && favorites.includes(featured.id);
                  const thumbnails = album.photos || [];

                  return (
                    <section key={album.id} className="nd-section">
                      {/* Section Header */}
                      <div className="nd-section-header">
                        <h2 className="nd-section-title">{album.title}</h2>
                        <div className="nd-section-meta">
                          <span className="nd-meta-text">
                            {album.date} · {album.photoCount} Photo{album.photoCount !== 1 ? "s" : ""}
                          </span>
                          <img
                            src={album.author?.avatar || currentUserAvatar}
                            alt={album.author?.name || "Author"}
                            className="nd-meta-avatar"
                            title={`Uploaded by ${album.author?.name || "Member"}`}
                          />
                        </div>
                      </div>

                      {/* Mosaic Grid Layout */}
                      <div className="nd-mosaic-grid">
                        {/* 1. Large Feature Card */}
                        {featured && (
                          <div
                            className="nd-feature-card"
                            onClick={() => openPhotoModal(featured)}
                          >
                            <img
                              src={featured.image}
                              alt={featured.title}
                              className="nd-card-img"
                              loading="lazy"
                            />
                            <div className="nd-card-overlay">
                              <span className="nd-card-title">{featured.title}</span>
                              <button
                                className={`nd-like-btn ${isFeaturedLiked ? "liked" : ""}`}
                                onClick={(e) => toggleFavorite(featured.id, e)}
                                title={isFeaturedLiked ? "Remove favorite" : "Add to favorites"}
                                type="button"
                              >
                                {isFeaturedLiked ? "❤️" : "🤍"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Small Thumbnails */}
                        {thumbnails.map((photo) => {
                          const isLiked = favorites.includes(photo.id);
                          return (
                            <div
                              key={photo.id}
                              className="nd-thumb-card"
                              onClick={() => openPhotoModal(photo)}
                            >
                              <img
                                src={photo.image}
                                alt={photo.title}
                                className="nd-card-img"
                                loading="lazy"
                              />
                              <div className="nd-card-overlay">
                                <span className="nd-card-title">{photo.title}</span>
                                <button
                                  className={`nd-like-btn nd-like-btn--small ${isLiked ? "liked" : ""}`}
                                  onClick={(e) => toggleFavorite(photo.id, e)}
                                  title={isLiked ? "Remove favorite" : "Add to favorites"}
                                  type="button"
                                >
                                  {isLiked ? "❤️" : "🤍"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: ALBUMS ───────────────────────── */}
        {activeTab === "Albums" && (
          <div className="nd-content-wrap">
            <div className="nd-title-row">
              <h1 className="nd-view-title">Albums</h1>
              <span className="nd-total-count">{albums.length} albums</span>
            </div>

            {albums.length === 0 ? (
              <div className="nd-empty-state">
                <div className="nd-empty-icon">📁</div>
                <h3>No Albums Created Yet</h3>
                <p>
                  Albums are created dynamically whenever you upload photos with an album or
                  category name.
                </p>
                <button
                  className="nd-create-btn"
                  style={{ width: "auto", padding: "12px 28px", marginTop: "12px" }}
                  onClick={() => setCreateModalOpen(true)}
                  type="button"
                >
                  ➕ Create First Album
                </button>
              </div>
            ) : (
              <div className="nd-albums-grid">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="nd-album-card"
                    onClick={() => {
                      setSelectedFilter(album.title);
                      setActiveTab("Photos");
                    }}
                  >
                    <div className="nd-album-cover">
                      <img
                        src={album.featuredPhoto?.image || album.photos?.[0]?.image}
                        alt={album.title}
                        className="nd-album-img"
                      />
                      <span className="nd-album-badge">
                        {album.photoCount} Photo{album.photoCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="nd-album-info">
                      <h3 className="nd-album-title">{album.title}</h3>
                      <p className="nd-album-sub">{album.location || album.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
              <AddPhoto onAddPhoto={handleAddPhoto} />
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
