import { useState, useEffect } from "react";
import "./CyberDialUnlock.css";

/**
 * PhotoGallery Morphing Auth Loader
 * Recreates the motion graphic sequence from the reference video:
 * 1. 3D Rotating Geometric Shapes (Pentagon, Triangles, Square, Hexagon, Circle)
 * 2. Sine Wave Dots
 * 3. Spinning Propeller / Vortex
 * 4. Fluid Bouncing Droplets (Orange & Cyan)
 * 5. Camera Aperture Dome Emblem + Horizontal Shutter Reveal of "PhotoGallery"
 */
function CyberDialUnlock({
  state = "verifying", // "verifying" | "success" | "error"
  title = "Authenticating...",
  subtitle = "Validating security authentication token",
  successTitle = "Welcome to PhotoGallery!",
  successSubtitle = "Opening your personal photo gallery...",
  errorMessage = "Authentication failed. Please check your credentials.",
  onComplete,
  onRetry,
}) {
  // Current animation phase:
  // 0: Geometric Shapes
  // 1: Sine Wave Dots
  // 2: Spinning Propeller Vortex
  // 3: Fluid Bouncing Droplets
  // 4: Final Logo Reveal ("PhotoGallery")
  const [phase, setPhase] = useState(0);

  // Cycle through animation phases during verification
  useEffect(() => {
    if (state !== "verifying") return;

    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 5);
    }, 850);

    return () => clearInterval(interval);
  }, [state]);

  // When verification succeeds, lock to Phase 4 (Final Logo Reveal) and complete
  useEffect(() => {
    if (state === "success") {
      setPhase(4);
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2100);
      return () => clearTimeout(timer);
    }
  }, [state, onComplete]);

  // On error, lock to final logo state with error indicators
  useEffect(() => {
    if (state === "error") {
      setPhase(4);
    }
  }, [state]);

  return (
    <div className="pgm-overlay" role="dialog" aria-modal="true">
      <div className="pgm-stage-backdrop" />

      {/* Main Motion Graphic Stage */}
      <div className={`pgm-stage pgm-state-${state}`}>
        {/* PHASE 0: 3D Rotating Geometric Shapes (00:00) */}
        {phase === 0 && (
          <div className="pgm-shapes-row">
            {/* Pentagon */}
            <div className="pgm-shape-wrap pgm-sw-1">
              <svg className="pgm-shape" viewBox="0 0 24 24">
                <polygon points="12,2 22,9 18,21 6,21 2,9" fill="#FFFFFF" />
              </svg>
            </div>
            {/* Triangle Right */}
            <div className="pgm-shape-wrap pgm-sw-2">
              <svg className="pgm-shape" viewBox="0 0 24 24">
                <polygon points="5,3 21,12 5,21" fill="#FFFFFF" />
              </svg>
            </div>
            {/* Diamond / Tilted Square */}
            <div className="pgm-shape-wrap pgm-sw-3">
              <svg className="pgm-shape" viewBox="0 0 24 24">
                <polygon points="12,2 22,12 12,22 2,12" fill="#FFFFFF" />
              </svg>
            </div>
            {/* Hexagon */}
            <div className="pgm-shape-wrap pgm-sw-4">
              <svg className="pgm-shape" viewBox="0 0 24 24">
                <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#FFFFFF" />
              </svg>
            </div>
            {/* Triangle Up */}
            <div className="pgm-shape-wrap pgm-sw-5">
              <svg className="pgm-shape" viewBox="0 0 24 24">
                <polygon points="12,3 22,21 2,21" fill="#FFFFFF" />
              </svg>
            </div>
            {/* Circle */}
            <div className="pgm-shape-wrap pgm-sw-6">
              <svg className="pgm-shape" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" />
              </svg>
            </div>
          </div>
        )}

        {/* PHASE 1: Sine Wave Dots (00:01) */}
        {phase === 1 && (
          <div className="pgm-wave-row">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="pgm-wave-dot"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}

        {/* PHASE 2: Spinning Propeller Vortex (00:02) */}
        {phase === 2 && (
          <div className="pgm-propeller-wrap">
            <svg className="pgm-propeller" viewBox="0 0 54 54">
              <polygon points="27,27 12,9 42,9" fill="#FFFFFF" />
              <polygon points="27,27 12,45 42,45" fill="#FFFFFF" />
              <circle cx="27" cy="27" r="4.5" fill="#FFFFFF" />
            </svg>
          </div>
        )}

        {/* PHASE 3: Fluid Bouncing Droplets (00:03 - 00:05) */}
        {phase === 3 && (
          <div className="pgm-droplets-wrap">
            <div className="pgm-drop pgm-drop-orange" />
            <div className="pgm-drop pgm-drop-cyan" />
            <div className="pgm-drop-spark" />
          </div>
        )}

        {/* PHASE 4: Final Logo Reveal with Emblem + "PhotoGallery" Text (00:06 - 00:10) */}
        {phase === 4 && (
          <div className={`pgm-reveal-wrap ${state === "success" ? "is-success" : ""}`}>
            {/* Left Emblem Mark */}
            <div className={`pgm-emblem ${state === "success" ? "pgm-emblem-glow" : ""}`}>
              <svg className="pgm-emblem-svg" viewBox="0 0 52 52">
                {/* Top Beacon Circle */}
                <circle cx="26" cy="9.5" r="4.5" className="pgm-path-beacon" />
                {/* Upper Camera Dome / Arch */}
                <path
                  d="M 8,30 C 8,17 16,14.5 26,14.5 C 36,14.5 44,17 44,30 Z"
                  className="pgm-path-dome"
                />
                {/* Center Aperture Lens */}
                <circle cx="26" cy="26" r="5" className="pgm-path-core" />
                {/* Lower Curved Base */}
                <path
                  d="M 12,36 C 16.5,43.5 35.5,43.5 40,36 Z"
                  className="pgm-path-base"
                />
              </svg>
            </div>

            {/* Right Shutter Reveal Text: "PhotoGallery" */}
            <div className="pgm-text-shutter-container">
              <div className="pgm-shutter-curtain" />
              <div className="pgm-brand-heading">
                <span className="pgm-brand-photo">Photo</span>
                <span className="pgm-brand-gallery">Gallery</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Typography & Feedback */}
      <div className="pgm-info">
        <div className={`pgm-badge pgm-badge--${state}`}>
          {state === "verifying" && "⟳ AUTHENTICATING"}
          {state === "success" && "✓ VERIFIED"}
          {state === "error" && "✕ VERIFICATION FAILED"}
        </div>

        <h3 className="pgm-title">
          {state === "verifying" && title}
          {state === "success" && successTitle}
          {state === "error" && "Authentication Error"}
        </h3>

        <p className="pgm-subtitle">
          {state === "verifying" && subtitle}
          {state === "success" && successSubtitle}
          {state === "error" && errorMessage}
        </p>

        {state !== "error" ? (
          <div className="pgm-progress-bar">
            <div className="pgm-progress-fill" />
          </div>
        ) : (
          onRetry && (
            <button type="button" className="pgm-retry-btn" onClick={onRetry}>
              Try Again
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default CyberDialUnlock;
