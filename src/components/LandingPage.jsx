import { useState } from "react";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";
import { AESTHETIC_SHOWCASE_PHOTOS } from "../data/photos";

function LandingPage({ darkMode, toggleDarkMode }) {
  const [authModal, setAuthModal] = useState({ open: false, tab: "register" });

  const openRegister = () => setAuthModal({ open: true, tab: "register" });
  const openLogin    = () => setAuthModal({ open: true, tab: "login" });
  const closeModal   = () => setAuthModal((p) => ({ ...p, open: false }));

  return (
    <div className={darkMode ? "app dark-mode landing-root" : "app landing-root"}>

      {/* ── NAVBAR ─────────────────────────── */}
      <Navbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onSelectGallery={openLogin}
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
            <button className="lp-cta-primary" onClick={openRegister}>
              Get Started →
            </button>
            <button className="lp-cta-ghost" onClick={openLogin}>
              Sign In →
            </button>
          </div>

          <div className="lp-stats-row">
            <div className="lp-stat"><strong>📸</strong><span>Photo Gallery</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>Free</strong><span>Forever</span></div>
          </div>
        </div>

        {/* Floating preview cards with aesthetic, unique photos */}
        <div className="lp-preview-cards" aria-hidden="true">
          {AESTHETIC_SHOWCASE_PHOTOS.map((item, i) => (
            <div className={`lp-card lp-card-${i + 1}`} key={item.id}>
              <img
                src={item.image}
                alt={item.title}
                className="lp-card-img"
                loading="eager"
              />
              <div className="lp-card-body">
                <span>{item.badge}</span>
                <p>{item.title}</p>
              </div>
            </div>
          ))}
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

      {/* ── AUTH MODAL ────────────────────── */}
      <AuthModal isOpen={authModal.open} defaultTab={authModal.tab} onClose={closeModal} />
    </div>
  );
}

export default LandingPage;
