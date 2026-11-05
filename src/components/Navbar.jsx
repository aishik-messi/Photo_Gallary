import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../config";
import AuthModal from "./AuthModal";
import ThemeToggleSwitch from "./ThemeToggleSwitch";

function Navbar({
  darkMode,
  toggleDarkMode,
  onSelectFavorites,
  onSelectGallery,
  onSelectHome,
}) {
  const { user, logout } = useAuth();
  const [authModal, setAuthModal] = useState({ open: false, tab: "login" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openLogin = () => {
    setMobileMenuOpen(false);
    setAuthModal({ open: true, tab: "login" });
  };
  const openRegister = () => {
    setMobileMenuOpen(false);
    setAuthModal({ open: true, tab: "register" });
  };
  const closeModal = () => setAuthModal((prev) => ({ ...prev, open: false }));

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onSelectHome) onSelectHome();
    else {
      const el = document.getElementById("home");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGalleryClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onSelectGallery) onSelectGallery();
    else {
      const el = document.getElementById("gallery");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFavoritesClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onSelectFavorites) onSelectFavorites();
    else {
      const el = document.getElementById("gallery");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav className="navbar" id="home">
        {/* Logo */}
        <a href="#home" className="logo" onClick={handleHomeClick} style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Photo Gallery Logo" className="brand-logo-img" />
          <span>Photo<span>Gallery</span></span>
        </a>

        {/* Desktop Navigation Links removed per request */}

        {/* Right side controls (Desktop) */}
        <div className="nav-actions">
          {/* Animated Sky Theme Toggle */}
          <ThemeToggleSwitch
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            size="md"
          />

          {/* Auth section */}
          {user ? (
            <div className="nav-user">
              <div className="nav-avatar" title={user.username}>
                {user.profilePicture ? (
                  <img
                    src={resolveImageUrl(user.profilePicture)}
                    alt="avatar"
                    className="nav-avatar-img"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <span className="nav-username">{user.username}</span>
              <button
                className="nav-logout-btn"
                onClick={logout}
                title="Sign out"
                type="button"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="nav-auth-btns">
              <button className="nav-login-btn" onClick={openLogin} type="button">
                Sign In
              </button>
              <button className="nav-register-btn" onClick={openRegister} type="button">
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            className={`nav-hamburger-btn ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
            type="button"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          className="nav-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`nav-mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="nav-mobile-header">
          <div className="logo" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="Photo Gallery Logo" className="brand-logo-img" />
            <span>Photo<span>Gallery</span></span>
          </div>
          <button
            className="nav-mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* User preview banner on mobile */}
        {user ? (
          <div className="nav-mobile-user-card">
            <div className="nav-avatar">
              {user.profilePicture ? (
                <img
                  src={resolveImageUrl(user.profilePicture)}
                  alt="avatar"
                  className="nav-avatar-img"
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="nav-mobile-user-info">
              <span className="nav-mobile-username">{user.username}</span>
            </div>
          </div>
        ) : null}



        <div className="nav-mobile-actions">
          {/* Animated Sky Theme Toggle in Mobile Drawer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(108, 99, 255, 0.08)", borderRadius: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: darkMode ? "#f1f5f9" : "#334155" }}>
              {darkMode ? "Night Mode" : "Day Mode"}
            </span>
            <ThemeToggleSwitch
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              size="sm"
            />
          </div>

          {/* Mobile Auth actions */}
          {user ? (
            <button
              className="nav-mobile-logout-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              type="button"
            >
              <span className="nav-link-icon">🚪</span> Sign Out
            </button>
          ) : (
            <div className="nav-mobile-auth-row">
              <button
                className="nav-mobile-signin-btn"
                onClick={openLogin}
                type="button"
              >
                Sign In
              </button>
              <button
                className="nav-mobile-signup-btn"
                onClick={openRegister}
                type="button"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModal.open}
        defaultTab={authModal.tab}
        onClose={closeModal}
      />
    </>
  );
}

export default Navbar;
