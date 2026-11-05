import { useState } from "react";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";
import ImageModal from "./ImageModal";
import RevolvingCarousel3D from "./RevolvingCarousel3D";
import defaultPhotos from "../data/photos";

function LandingPage({ darkMode, toggleDarkMode, onExploreGallery }) {
  const [authModal, setAuthModal] = useState({ open: false, tab: "register" });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const f = localStorage.getItem("favorites");
      return f ? JSON.parse(f) : ["photo_friends_beach", "photo_aesthetic_food", "photo_feature_couple"];
    } catch {
      return ["photo_friends_beach", "photo_aesthetic_food", "photo_feature_couple"];
    }
  });

  const openRegister = () => setAuthModal({ open: true, tab: "register" });
  const openLogin    = () => setAuthModal({ open: true, tab: "login" });
  const closeModal   = () => setAuthModal((p) => ({ ...p, open: false }));

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("favorites", JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const currentModalIndex = selectedPhoto
    ? defaultPhotos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  const nextPhoto = () => {
    if (currentModalIndex >= 0 && currentModalIndex < defaultPhotos.length - 1) {
      setSelectedPhoto(defaultPhotos[currentModalIndex + 1]);
    } else {
      setSelectedPhoto(defaultPhotos[0]);
    }
  };

  const previousPhoto = () => {
    if (currentModalIndex > 0) {
      setSelectedPhoto(defaultPhotos[currentModalIndex - 1]);
    } else {
      setSelectedPhoto(defaultPhotos[defaultPhotos.length - 1]);
    }
  };

  return (
    <div className={darkMode ? "app dark-mode landing-root" : "app landing-root"}>

      {/* ── NAVBAR ─────────────────────────── */}
      <Navbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onSelectGallery={onExploreGallery || openLogin}
      />

      {/* ── HERO ───────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
        </div>

        <div className="lp-hero-content">
          <span className="lp-badge">📸 Smart photo storage, organized your way</span>

          <h1 className="lp-heading">
            Store &amp; Browse Photos
            <br />
            <span className="lp-heading-gradient">Category by Category</span>
          </h1>

          <p className="lp-subtext">
            Your personal Photo Gallery. Upload photos, organize them into
            categories like Nature, Travel, Food &amp; more — then browse,
            search and enjoy them anywhere, anytime.
          </p>

          <div className="lp-cta-row">
            <button className="lp-cta-primary" onClick={onExploreGallery || openRegister}>
              Explore Gallery Store →
            </button>
            <button className="lp-cta-ghost" onClick={openLogin}>
              Sign In →
            </button>
          </div>

          <div className="lp-stats-row">
            <div className="lp-stat"><strong>17</strong><span>Curated Works</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>5 Columns</strong><span>Mosaic Structure</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>Free</strong><span>Forever</span></div>
          </div>
        </div>

        {/* 3D Revolving Cylinder Carousel Showcase (as shown in reference video) */}
        <RevolvingCarousel3D
          items={defaultPhotos}
          onSelectCard={(p) => setSelectedPhoto(p)}
        />
      </section>

      {/* ── PHOTO STORE MOSAIC GRID SHOWCASE (Matching Reference Image) ── */}
      <section className="lp-store-section" id="gallery" style={{ padding: "60px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="lp-section-label">PHOTO STORE ARCHITECTURE</div>
          <h2 className="lp-section-title" style={{ fontSize: "28px", marginTop: "8px" }}>
            5-Column Mosaic Photo Store Structure
          </h2>
          <p style={{ color: "var(--nd-text-subtle)", maxWidth: "600px", margin: "10px auto 0", fontSize: "14.5px" }}>
            Precision 5-column continuous photo stream with a 2×2 featured centerpiece card across rows 3–4.
          </p>
        </div>

        <div className="nd-mosaic-grid">
          {defaultPhotos.map((photo, index) => {
            const isFeatureCard = index === 13;
            const isLiked = favorites.includes(photo.id);

            return (
              <div
                key={photo.id || index}
                className={`nd-grid-card ${isFeatureCard ? "nd-grid-card--feature" : ""}`}
                onClick={() => setSelectedPhoto(photo)}
                role="button"
                tabIndex={0}
              >
                <div className="nd-grid-card-inner">
                  <img
                    src={photo.image || photo.imageUrl}
                    alt={photo.title || "Photo"}
                    className="nd-card-img"
                    loading="lazy"
                  />
                  <div className="nd-card-overlay">
                    <div className="nd-card-overlay-top">
                      <span className="nd-card-badge">{photo.category || "Curated"}</span>
                      <button
                        className={`nd-like-btn ${isLiked ? "liked" : ""}`}
                        onClick={(e) => toggleFavorite(photo.id, e)}
                        type="button"
                        aria-label="Like photo"
                      >
                        <span className="nd-like-icon">{isLiked ? "❤️" : "🤍"}</span>
                        <span className="nd-like-count">{(photo.initialLikes || 0) + (isLiked ? 1 : 0)}</span>
                      </button>
                    </div>
                    <div className="nd-card-overlay-bottom">
                      <div className="nd-card-info">
                        <span className="nd-card-title">{photo.title}</span>
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

        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <button
            className="lp-cta-primary lp-cta-big"
            onClick={onExploreGallery || openRegister}
            style={{ width: "auto", padding: "14px 36px" }}
          >
            📸 Enter Photo Store Gallery
          </button>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-section-label">WHY PHOTO GALLERY</div>
        <h2 className="lp-section-title">Photo storage built around categories</h2>

        <div className="lp-features-grid">
          {[
            { icon: "🗂️", title: "Category Folders", desc: "Organise into Nature, Travel, Food, Animals, People & more — easy to find anytime." },
            { icon: "📤", title: "Easy Upload", desc: "Pick any image, add a title, choose a category and tags — uploaded in seconds." },
            { icon: "🔍", title: "Category Search", desc: "Filter your entire gallery by category or search by title in real time." },
            { icon: "❤️", title: "Favourites", desc: "Heart your best shots and view them in a dedicated favourites feed." },
            { icon: "🖼️", title: "Lightbox View", desc: "Open any photo full-screen with smooth prev / next category navigation." },
          ].map((f) => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────── */}
      <section className="lp-how" id="how">
        <div className="lp-section-label">HOW IT WORKS</div>
        <h2 className="lp-section-title">Your photo gallery in 3 steps</h2>

        <div className="lp-steps">
          {[
            { n: "01", title: "Create a free account", desc: "Sign up with your email — your private photo gallery is instantly ready." },
            { n: "02", title: "Upload & categorise", desc: "Pick any photo, assign a category (Nature, Travel, Food…) and save it." },
            { n: "03", title: "Browse by category", desc: "Filter your gallery by category, search by name, and view photos in a beautiful lightbox." },
          ].map((s) => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────── */}
      <section className="lp-bottom-cta">
        <div className="lp-blob lp-blob-bottom" />
        <h2>Start your photo gallery today</h2>
        <p>Upload, organise by category &amp; access your photos from anywhere — 100% free.</p>
        <button className="lp-cta-primary lp-cta-big" onClick={openRegister}>
          ✨ Create My Photo Gallery
        </button>
      </section>

      {/* ── FOOTER ────────────────────────── */}
      <footer className="lp-footer">
        <div className="logo" style={{ display: "inline-flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
          <img src="/logo.png" alt="Photo Gallery Logo" className="brand-logo-img" />
          <span>Photo<span>Gallery</span></span>
        </div>
        <p>© 2026 Photo Gallery — Store &amp; browse your photos by category.</p>
      </footer>

      {/* ── LIGHTBOX MODAL ────────────────── */}
      <ImageModal
        photo={selectedPhoto}
        photos={defaultPhotos}
        currentIndex={currentModalIndex}
        closeModal={() => setSelectedPhoto(null)}
        nextPhoto={nextPhoto}
        previousPhoto={previousPhoto}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      {/* ── AUTH MODAL ────────────────────── */}
      <AuthModal isOpen={authModal.open} defaultTab={authModal.tab} onClose={closeModal} />
    </div>
  );
}

export default LandingPage;
