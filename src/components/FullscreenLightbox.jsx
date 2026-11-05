import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Share2,
  Play,
  Pause,
  Heart,
  Trash2,
  Info,
  ImageOff,
  Check,
} from "lucide-react";
import "./FullscreenLightbox.css";

/**
 * Modern, responsive Fullscreen Image Viewer (Lightbox)
 * Feature-rich implementation for PhotoGallery:
 * - Centered viewport with original aspect ratio preservation
 * - Smooth fade-in and zoom entrance animations
 * - Mouse drag-to-pan & step zoom (1x to 4x)
 * - Keyboard shortcuts (Arrows, Esc, Space, F, +, -, 0, I, T)
 * - Mobile touch swipe gestures (left, right, swipe-down to dismiss)
 * - Auto slideshow with visual progress ring & auto-pause on interaction
 * - Bottom thumbnail navigation strip with active center auto-scroll
 * - Image metadata overlay (Title, Category, Location, Description, Counter)
 * - Native HTML5 Fullscreen toggle
 * - Direct image download with custom filename
 * - Web Share API with clipboard copy fallback toast
 * - Favorite like/unlike & delete integration
 * - Loading spinner & graceful broken-image error card
 */
function FullscreenLightbox({
  photo,
  photos = [],
  currentIndex = 0,
  closeModal,
  nextPhoto,
  previousPhoto,
  onSelectIndex,
  favorites = [],
  toggleFavorite,
  onDeletePhoto,
}) {
  const containerRef = useRef(null);
  const imageStageRef = useRef(null);
  const thumbnailsStripRef = useRef(null);
  const thumbItemRefs = useRef([]);

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideshowProgress, setSlideshowProgress] = useState(0);

  const [showInfo, setShowInfo] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);

  // Touch gesture tracking for mobile swipe
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchDeltaRef = useRef({ x: 0, y: 0 });

  const totalPhotos = photos.length || (photo ? 1 : 0);
  const activeIndex = currentIndex >= 0 ? currentIndex : photos.findIndex((p) => p.id === photo?.id);

  /* ── 1. Toast Notification Helper ── */
  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
    }, 2400);
  }, []);

  /* ── 2. Navigation wrappers ── */
  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setSlideshowProgress(0);
    if (nextPhoto) nextPhoto();
  }, [nextPhoto]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setSlideshowProgress(0);
    if (previousPhoto) previousPhoto();
  }, [previousPhoto]);

  const handleSelectThumb = useCallback((idx) => {
    setIsPlaying(false);
    setSlideshowProgress(0);
    if (onSelectIndex) {
      onSelectIndex(idx);
    } else if (idx > activeIndex) {
      for (let i = 0; i < idx - activeIndex; i++) nextPhoto?.();
    } else if (idx < activeIndex) {
      for (let i = 0; i < activeIndex - idx; i++) previousPhoto?.();
    }
  }, [onSelectIndex, activeIndex, nextPhoto, previousPhoto]);

  /* ── 3. Zoom Handlers ── */
  const zoomIn = useCallback(() => {
    setIsPlaying(false);
    setZoom((prev) => Math.min(4, Number((prev + 0.35).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setIsPlaying(false);
    setZoom((prev) => {
      const next = Math.max(1, Number((prev - 0.35).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleToggleZoom = useCallback((e) => {
    e.stopPropagation();
    setIsPlaying(false);
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2.2);
    }
  }, [zoom, resetZoom]);

  /* ── 4. Slideshow Play / Pause ── */
  const toggleSlideshow = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setSlideshowProgress(0);
  }, []);

  /* ── 5. Fullscreen Toggle ── */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* ── 6. Download Photo ── */
  const handleDownload = useCallback(async (e) => {
    e?.stopPropagation();
    if (!photo) return;
    const imgUrl = photo.image || photo.imageUrl;
    const safeTitle = (photo.title || "photo").replace(/[^a-zA-Z0-9_-]/g, "_");

    try {
      showToast("Preparing download...");
      const response = await fetch(imgUrl, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `PhotoGallery_${safeTitle}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast("Download started!");
    } catch {
      // Fallback: direct anchor download
      const link = document.createElement("a");
      link.href = imgUrl;
      link.download = `PhotoGallery_${safeTitle}.jpg`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Download started!");
    }
  }, [photo, showToast]);

  /* ── 7. Share Photo ── */
  const handleShare = useCallback(async (e) => {
    e?.stopPropagation();
    if (!photo) return;
    const imgUrl = photo.image || photo.imageUrl;
    const shareData = {
      title: photo.title || "PhotoGallery",
      text: photo.description || `Viewing "${photo.title || "Photo"}" on PhotoGallery`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Share failed:", err);
        }
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(imgUrl || window.location.href);
      showToast("Photo link copied to clipboard! 📋");
    } catch {
      showToast("Could not copy link.");
    }
  }, [photo, showToast]);

  /* ── 8. Prevent Background Scrolling ── */
  useEffect(() => {
    if (!photo) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [photo]);

  /* ── 8b. Android Hardware / Gesture Back Button (History popstate) ── */
  useEffect(() => {
    if (!photo) return;

    // Push entry to browser history so Android back button/swipe closes the lightbox
    try {
      window.history.pushState({ pgLightbox: true }, "");
    } catch (e) {
      console.warn("Could not push history state:", e);
    }

    const handlePopState = () => {
      closeModal();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      try {
        if (window.history.state?.pgLightbox) {
          window.history.back();
        }
      } catch (e) {
        console.warn("Could not pop history state:", e);
      }
    };
  }, [photo, closeModal]);

  /* ── 9. Reset Zoom/Pan on image change ── */
  useEffect(() => {
    resetZoom();
    setIsLoading(true);
    setHasError(false);
  }, [photo?.id, resetZoom]);

  /* ── 10. Auto-scroll active thumbnail into view ── */
  useEffect(() => {
    if (activeIndex >= 0 && thumbItemRefs.current[activeIndex]) {
      thumbItemRefs.current[activeIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  /* ── 11. Slideshow Timer & Progress ── */
  useEffect(() => {
    if (!isPlaying) {
      setSlideshowProgress(0);
      return;
    }

    const DURATION = 3600; // 3.6s per slide
    const INTERVAL = 40;
    const step = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      setSlideshowProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isPlaying, handleNext]);

  /* ── 12. Keyboard Navigation ── */
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeModal();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case " ":
          e.preventDefault();
          toggleSlideshow();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
        case "r":
        case "R":
          e.preventDefault();
          resetZoom();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "i":
        case "I":
          e.preventDefault();
          setShowInfo((prev) => !prev);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setShowThumbnails((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    photo,
    closeModal,
    handlePrev,
    handleNext,
    toggleSlideshow,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
  ]);

  /* ── 13. Mouse Drag / Pan for Zoomed Image ── */
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /* ── 14. Mouse Wheel Zoom ── */
  const handleWheel = (e) => {
    e.preventDefault();
    setIsPlaying(false);
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))));
    } else {
      setZoom((z) => {
        const next = Math.max(1, Number((z - 0.25).toFixed(2)));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  /* ── 15. Touch / Swipe Gestures for Mobile ── */
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      touchDeltaRef.current = { x: 0, y: 0 };

      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        });
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      touchDeltaRef.current = {
        x: currentX - touchStartRef.current.x,
        y: currentY - touchStartRef.current.y,
      };

      if (zoom > 1 && isDragging) {
        setPan({
          x: currentX - dragStart.x,
          y: currentY - dragStart.y,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (zoom > 1) return;

    const deltaX = touchDeltaRef.current.x;
    const deltaY = touchDeltaRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const time = Date.now() - touchStartRef.current.time;

    // Fast flick or clear swipe (> 45px)
    if (time < 450 || absX > 55 || absY > 75) {
      // Horizontal swipe navigation
      if (absX > absY && absX > 45) {
        if (deltaX < 0) {
          handleNext(); // swipe left -> next
        } else {
          handlePrev(); // swipe right -> prev
        }
      }
      // Vertical swipe down to close
      else if (deltaY > 85 && absY > absX) {
        closeModal();
      }
    }
  };

  if (!photo) return null;

  const isFavorite = favorites.includes(photo.id);
  const baseLikes = typeof photo.likesCount === "number"
    ? photo.likesCount
    : (Array.isArray(photo.likes) ? photo.likes.length : (photo.initialLikes || 0));
  const likeCount = baseLikes + (isFavorite && !Array.isArray(photo.likes) ? 1 : 0);
  const currentImageUrl = photo.image || photo.imageUrl;

  return (
    <div
      ref={containerRef}
      className={`pg-lb-overlay ${isFullscreen ? "pg-lb--fullscreen" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${photo.title || "Photo"}`}
      onClick={(e) => {
        // Close if clicking directly on the backdrop
        if (e.target === e.currentTarget) closeModal();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── TOP GLASS CONTROLS BAR ──────────────────────────── */}
      <header className="pg-lb-topbar" onClick={(e) => e.stopPropagation()}>
        {/* Left Section: Back Cross Button, Counter, Slideshow, Info Toggle */}
        <div className="pg-lb-topbar-left">
          {/* Back Cross (X) Button - Always visible, first element, ideal for Android & mobile */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon pg-lb-btn--back-cross"
            onClick={closeModal}
            title="Back / Close (Esc)"
            aria-label="Back to gallery"
          >
            <X size={20} />
          </button>

          <div className="pg-lb-counter" title="Current photo position">
            <span className="pg-lb-counter-current">{activeIndex + 1}</span>
            <span className="pg-lb-counter-sep">/</span>
            <span className="pg-lb-counter-total">{totalPhotos}</span>
          </div>

          {/* Slideshow button */}
          <button
            type="button"
            className={`pg-lb-btn ${isPlaying ? "pg-lb-btn--active" : ""}`}
            onClick={toggleSlideshow}
            title={isPlaying ? "Pause Slideshow (Space)" : "Play Slideshow (Space)"}
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            <span className="pg-lb-btn-text">{isPlaying ? "Pause" : "Play"}</span>
            {isPlaying && (
              <span
                className="pg-lb-slideshow-indicator"
                style={{ transform: `scaleX(${slideshowProgress / 100})` }}
              />
            )}
          </button>

          {/* Metadata Toggle */}
          <button
            type="button"
            className={`pg-lb-btn pg-lb-btn-icon ${showInfo ? "pg-lb-btn--active" : ""}`}
            onClick={() => setShowInfo((p) => !p)}
            title={showInfo ? "Hide image details (I)" : "Show image details (I)"}
            aria-label="Toggle image details"
          >
            <Info size={17} />
          </button>
        </div>

        {/* Right Section: Zoom (desktop), Fullscreen (desktop), Download, Share, Favorite, Delete, Close */}
        <div className="pg-lb-topbar-right">
          {/* Zoom Out - Desktop */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon pg-lb-desktop-only"
            onClick={zoomOut}
            disabled={zoom <= 1}
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut size={17} />
          </button>

          {/* Zoom Percentage / Reset - Desktop */}
          <button
            type="button"
            className={`pg-lb-zoom-pill pg-lb-desktop-only ${zoom > 1 ? "is-zoomed" : ""}`}
            onClick={resetZoom}
            title="Reset Zoom (0 or R)"
            aria-label="Reset zoom"
          >
            <span>{Math.round(zoom * 100)}%</span>
            {zoom > 1 && <RotateCcw size={13} className="pg-lb-rotate-icon" />}
          </button>

          {/* Zoom In - Desktop */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon pg-lb-desktop-only"
            onClick={zoomIn}
            disabled={zoom >= 4}
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <ZoomIn size={17} />
          </button>

          <div className="pg-lb-divider pg-lb-desktop-only" />

          {/* Fullscreen Toggle - Desktop */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon pg-lb-desktop-only"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>

          {/* Download */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon"
            onClick={handleDownload}
            title="Download Image"
            aria-label="Download image"
          >
            <Download size={17} />
          </button>

          {/* Share */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon"
            onClick={handleShare}
            title="Share or Copy Link"
            aria-label="Share image"
          >
            <Share2 size={17} />
          </button>

          {/* Favorite */}
          {toggleFavorite && (
            <button
              type="button"
              className={`pg-lb-btn pg-lb-btn-icon ${isFavorite ? "pg-lb-btn--liked" : ""}`}
              onClick={(e) => toggleFavorite(photo.id, e)}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={17}
                fill={isFavorite ? "#ff4757" : "none"}
                color={isFavorite ? "#ff4757" : "currentColor"}
              />
              {likeCount > 0 && <span className="pg-lb-like-count">{likeCount}</span>}
            </button>
          )}

          {/* Delete (if owner or provided) */}
          {onDeletePhoto && (
            <button
              type="button"
              className="pg-lb-btn pg-lb-btn-icon pg-lb-btn--danger"
              onClick={() => onDeletePhoto(photo.id)}
              title="Delete photo"
              aria-label="Delete photo"
            >
              <Trash2 size={17} />
            </button>
          )}

          <div className="pg-lb-divider pg-lb-desktop-only" />

          {/* Close X Button (Desktop) */}
          <button
            type="button"
            className="pg-lb-btn pg-lb-btn-icon pg-lb-btn--close pg-lb-desktop-only"
            onClick={closeModal}
            title="Close Viewer (Esc)"
            aria-label="Close image viewer"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* ── MAIN IMAGE STAGE ────────────────────────────────── */}
      <main
        ref={imageStageRef}
        className="pg-lb-stage"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        {/* Navigation Arrow Previous */}
        {totalPhotos > 1 && (
          <button
            type="button"
            className="pg-lb-nav pg-lb-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Previous Photo (Left Arrow)"
            aria-label="Previous photo"
          >
            <ChevronLeft size={30} />
          </button>
        )}

        {/* Center Image Container */}
        <div
          className={`pg-lb-image-wrapper ${zoom > 1 ? "is-zoomed" : ""} ${isDragging ? "is-dragging" : ""}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleToggleZoom}
        >
          {/* Loading Spinner */}
          {isLoading && !hasError && (
            <div className="pg-lb-loader" aria-hidden="true">
              <div className="pg-lb-spinner" />
            </div>
          )}

          {/* Broken Image Fallback */}
          {hasError ? (
            <div className="pg-lb-error-card">
              <ImageOff size={44} className="pg-lb-error-icon" />
              <h3>Unable to load image</h3>
              <p>The photo could not be fetched or the URL is unavailable.</p>
              <button
                type="button"
                className="pg-lb-retry-btn"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <img
              key={photo.id || currentImageUrl}
              src={currentImageUrl}
              alt={photo.title || "Photo"}
              className={`pg-lb-img ${isLoading ? "is-loading" : "is-loaded"}`}
              draggable={false}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
        </div>

        {/* Navigation Arrow Next */}
        {totalPhotos > 1 && (
          <button
            type="button"
            className="pg-lb-nav pg-lb-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Next Photo (Right Arrow)"
            aria-label="Next photo"
          >
            <ChevronRight size={30} />
          </button>
        )}

        {/* ── IMAGE INFORMATION OVERLAY (Bottom-Left) ───────── */}
        {showInfo && (
          <div className="pg-lb-info-card" onClick={(e) => e.stopPropagation()}>
            <div className="pg-lb-info-header">
              <h2 className="pg-lb-info-title">{photo.title || "Untitled Moment"}</h2>
              <button
                type="button"
                className="pg-lb-info-dismiss"
                onClick={() => setShowInfo(false)}
                title="Hide details"
                aria-label="Hide details"
              >
                ✕
              </button>
            </div>

            <div className="pg-lb-info-meta">
              {photo.category && (
                <span className="pg-lb-badge pg-lb-badge--cat">
                  📁 {photo.category}
                </span>
              )}
              {photo.location && (
                <span className="pg-lb-badge pg-lb-badge--loc">
                  📍 {photo.location}
                </span>
              )}
              {photo.date && (
                <span className="pg-lb-badge pg-lb-badge--date">
                  📅 {photo.date}
                </span>
              )}
              {photo.user?.username && (
                <span className="pg-lb-badge pg-lb-badge--author">
                  👤 {photo.user.username}
                </span>
              )}
            </div>

            {photo.description && (
              <p className="pg-lb-info-desc">{photo.description}</p>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM THUMBNAIL STRIP ──────────────────────────── */}
      {totalPhotos > 1 && showThumbnails && (
        <footer className="pg-lb-strip-wrap" onClick={(e) => e.stopPropagation()}>
          <div className="pg-lb-strip" ref={thumbnailsStripRef}>
            {photos.map((item, idx) => {
              const isActive = idx === activeIndex;
              const thumbUrl = item.image || item.imageUrl;

              return (
                <button
                  key={item.id || `thumb_${idx}`}
                  ref={(el) => (thumbItemRefs.current[idx] = el)}
                  type="button"
                  className={`pg-lb-thumb-btn ${isActive ? "is-active" : ""}`}
                  onClick={() => handleSelectThumb(idx)}
                  title={`View photo ${idx + 1}: ${item.title || "Untitled"}`}
                  aria-label={`Jump to photo ${idx + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <img
                    src={thumbUrl}
                    alt={item.title || `Thumbnail ${idx + 1}`}
                    className="pg-lb-thumb-img"
                    loading="lazy"
                  />
                  {isActive && <div className="pg-lb-thumb-indicator" />}
                </button>
              );
            })}
          </div>
        </footer>
      )}

      {/* ── TOAST NOTIFICATION ──────────────────────────────── */}
      {toastMessage && (
        <div className="pg-lb-toast" role="status">
          <Check size={16} className="pg-lb-toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default FullscreenLightbox;

