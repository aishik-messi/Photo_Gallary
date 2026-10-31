import { useState, useEffect } from "react";
import "./CyberDialUnlock.css";

const RADIUS = 75; // px from center
const NUM_NODES = 8;

// Precompute positions for 8 nodes around a circle
const NODES_POS = Array.from({ length: NUM_NODES }, (_, i) => {
  const angle = (i * 360) / NUM_NODES;
  const rad = (angle * Math.PI) / 180;
  const x = Math.round(RADIUS * Math.cos(rad));
  const y = Math.round(RADIUS * Math.sin(rad));
  return { id: i, angle, x, y };
});

function CyberDialUnlock({
  state = "verifying", // "verifying" | "success" | "error"
  title = "Verifying Identity...",
  subtitle = "Validating security authentication token",
  successTitle = "Access Granted!",
  successSubtitle = "Opening your personal photo gallery...",
  errorMessage = "Authentication failed. Please check your credentials.",
  onComplete,
  onRetry,
}) {
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);

  // During verification, rotate active node to mirror the sweeping needle
  useEffect(() => {
    if (state !== "verifying") return;

    const interval = setInterval(() => {
      setActiveNodeIndex((prev) => (prev + 1) % NUM_NODES);
    }, 160); // 160ms * 8 ≈ 1.28s full rotation

    return () => clearInterval(interval);
  }, [state]);

  // When state becomes success, trigger onComplete after celebratory unlock animation
  useEffect(() => {
    if (state === "success") {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state, onComplete]);

  return (
    <div className="cdu-overlay" role="dialog" aria-modal="true">
      <div className="cdu-bg-glow" />

      {/* Cybernetic Dial Stage */}
      <div className={`cdu-stage ${state}`}>
        <div className="cdu-track-ring" />

        {/* Concentric ripples on success */}
        <div className="cdu-ripple cdu-ripple-1" />
        <div className="cdu-ripple cdu-ripple-2" />
        <div className="cdu-ripple cdu-ripple-3" />

        {/* Center Glowing Core */}
        <div className="cdu-center-node" />

        {/* Rotating Scanner Needle */}
        <div className="cdu-needle-arm">
          <div className="cdu-needle-line" />
        </div>

        {/* 8 Perimeter Nodes */}
        {NODES_POS.map((node, i) => {
          const isNodeActive =
            state === "success" || (state === "verifying" && i === activeNodeIndex);

          return (
            <div
              key={node.id}
              className={`cdu-node ${isNodeActive ? "active" : ""}`}
              style={{
                "--node-x": `${node.x}px`,
                "--node-y": `${node.y}px`,
              }}
            />
          );
        })}
      </div>

      {/* Status Info Typography */}
      <div className="cdu-info">
        <div className={`cdu-badge ${state}`}>
          {state === "verifying" && "⟳ AUTHENTICATING"}
          {state === "success" && "✓ VERIFIED"}
          {state === "error" && "✕ VERIFICATION FAILED"}
        </div>

        <h3 className="cdu-title">
          {state === "verifying" && title}
          {state === "success" && successTitle}
          {state === "error" && "Verification Error"}
        </h3>

        <p className="cdu-subtitle">
          {state === "verifying" && subtitle}
          {state === "success" && successSubtitle}
          {state === "error" && errorMessage}
        </p>

        {state !== "error" ? (
          <div className="cdu-progress-bar">
            <div className="cdu-progress-fill" />
          </div>
        ) : (
          onRetry && (
            <button type="button" className="cdu-retry-btn" onClick={onRetry}>
              Try Again
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default CyberDialUnlock;
