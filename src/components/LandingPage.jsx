import { useState } from "react";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";
import { isVideoMedia } from "../config";

function LandingPage({ darkMode, toggleDarkMode, onExploreDashboard }) {
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
        onSelectGallery={onExploreDashboard}
      />

      {/* ── HERO ───────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
        </div>

        <div className="lp-hero-content">
          <span className="lp-badge">📸 Smart photo &amp; video storage, organized your way</span>

          <h1 className="lp-heading">
            Store &amp; Browse Media
            <br />
            <span className="lp-heading-gradient">Category by Category</span>
          </h1>

          <p className="lp-subtext">
            Your personal Photo &amp; Video Gallery. Upload photos and videos, organize them into
            categories like Nature, Travel, Moments &amp; more — then browse,
            search and enjoy smooth animated playback anywhere, anytime.
          </p>

          <div className="lp-cta-row">
            <button className="lp-cta-primary" onClick={onExploreDashboard || openRegister}>
              ✨ View New Dashboard
            </button>
            <button className="lp-cta-ghost" onClick={openLogin}>
              Sign In →
            </button>
          </div>

          <div className="lp-stats-row">
            <div className="lp-stat"><strong>📸 🎬</strong><span>Photos &amp; Videos</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>6+</strong><span>Categories</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>Free</strong><span>Forever</span></div>
          </div>
        </div>

        {/* Floating preview cards with dynamic photos/videos & animated preview */}
        <div className="lp-preview-cards" aria-hidden="true">
          {(() => {
            let dynamicList = [];
            try {
              const saved = localStorage.getItem("dynamic_photos");
              if (saved) dynamicList = JSON.parse(saved);
            } catch {
              dynamicList = [];
            }

            if (dynamicList.length >= 3) {
              return dynamicList.slice(0, 3).map((photo, i) => {
                const isVid = isVideoMedia(photo);
                return (
                  <div className={`lp-card lp-card-${i + 1}`} key={photo.id || i}>
                    {isVid ? (
                      <div className="lp-card-media-wrap">
                        <video
                          src={photo.image}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="lp-card-img lp-card-video"
                        />
                        <span className="lp-video-badge">▶ Video</span>
                      </div>
                    ) : (
                      <img src={photo.image} alt={photo.title} className="lp-card-img" />
                    )}
                    <div className="lp-card-body">
                      <span>📁 {photo.category || "Album"}</span>
                    </div>
                  </div>
                );
              });
            }

            return (
              <>
                <div className="lp-card lp-card-1">
                  <div
                    className="lp-card-img"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                      fontSize: "42px",
                    }}
                  >
                    🌿
                  </div>
                  <div className="lp-card-body">
                    <span>🌿 Nature</span>
                  </div>
                </div>

                <div className="lp-card lp-card-2">
                  <div
                    className="lp-card-img"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
                      fontSize: "42px",
                    }}
                  >
                    ✈️
                  </div>
                  <div className="lp-card-body">
                    <span>✈️ Travel</span>
                  </div>
                </div>

                <div className="lp-card lp-card-3">
                  <div className="lp-card-media-wrap">
                    <video
                      src="/sample-video.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="lp-card-img lp-card-video"
                    />
                    <span className="lp-video-badge">▶ Video</span>
                  </div>
                  <div className="lp-card-body">
                    <span>🎬 Moments &amp; Videos</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-section-label">WHY PHOTO &amp; VIDEO GALLERY</div>
        <h2 className="lp-section-title">Media storage built around categories</h2>

        <div className="lp-features-grid">
          {[
            { icon: "🗂️", title: "Category Folders", desc: "Organise photos & videos into Nature, Travel, Food, Animals & more — easy to find anytime." },
            { icon: "📤", title: "Easy Upload", desc: "Pick any photo or video (.mp4, .webm, .mov), add a title, choose a category and tags — uploaded in seconds." },
            { icon: "🎬", title: "Video Animations", desc: "Smooth animated video cards with autoplay preview, hover playback, and floating card motion." },
            { icon: "🔍", title: "Category Search", desc: "Filter your entire gallery by category or search by title and tags in real time." },
            { icon: "❤️", title: "Favourites", desc: "Heart your best shots and videos, viewing them in a dedicated favourites feed." },
            { icon: "🖼️", title: "Full Lightbox", desc: "Open any photo or video full-screen with responsive controls and smooth next/prev navigation." },
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
        <h2 className="lp-section-title">Your photo &amp; video gallery in 3 steps</h2>

        <div className="lp-steps">
          {[
            { n: "01", title: "Create a free account", desc: "Sign up with your email — your private photo & video gallery is instantly ready." },
            { n: "02", title: "Upload & categorise", desc: "Pick any photo or video, assign a category (Nature, Travel, Moments…) and save it." },
            { n: "03", title: "Browse with animations", desc: "Filter your gallery by folder, enjoy animated video previews, and view in full lightbox." },
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
        <h2>Start your photo &amp; video gallery today</h2>
        <p>Upload, organise by category &amp; access your photos and videos from anywhere — 100% free.</p>
        <button className="lp-cta-primary lp-cta-big" onClick={openRegister}>
          📸 Create My Gallery
        </button>
      </section>

      {/* ── FOOTER ────────────────────────── */}
      <footer className="lp-footer">
        <div className="logo">📸 Photo<span>Gallery</span></div>
        <p>© 2026 Photo &amp; Video Gallery — Store &amp; browse your media by category.</p>
      </footer>

      {/* ── AUTH MODAL ────────────────────── */}
      <AuthModal isOpen={authModal.open} defaultTab={authModal.tab} onClose={closeModal} />
    </div>
  );
}

export default LandingPage;
