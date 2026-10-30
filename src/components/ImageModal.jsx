import { isVideoMedia } from "../config";

function ImageModal({
  photo,
  photos,
  currentIndex,
  closeModal,
  nextPhoto,
  previousPhoto,
  favorites,
  toggleFavorite,
  onDeletePhoto,
}) {
  if (!photo) {
    return null;
  }

  const isFavorite = favorites.includes(photo.id);
  const isVideo = isVideoMedia(photo);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="close-button" onClick={closeModal} title="Close">
          ✕
        </button>

        {/* Previous Button */}
        <button className="modal-nav previous" onClick={previousPhoto} title="Previous">
          ❮
        </button>

        {/* Media: Image or Video */}
        {isVideo ? (
          <video
            key={photo.id || photo.image}
            className="modal-image modal-video"
            src={photo.image}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            className="modal-image"
            src={photo.image}
            alt={photo.title}
          />
        )}

        {/* Next Button */}
        <button className="modal-nav next" onClick={nextPhoto} title="Next">
          ❯
        </button>

        {/* Information */}
        <div className="modal-info">
          <div>
            <h2>
              {photo.title} {isVideo && <span style={{ fontSize: "14px", fontWeight: "normal", background: "rgba(99,102,241,0.2)", color: "#6366f1", padding: "2px 8px", borderRadius: "12px", marginLeft: "8px" }}>▶ Video</span>}
            </h2>
            <p>
              {photo.category} {photo.location && `• 📍 ${photo.location}`} • {isVideo ? "Video" : "Photo"}{" "}
              {currentIndex + 1} of {photos.length}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Delete button */}
            {onDeletePhoto && (
              <button
                className="modal-delete-btn"
                title={`Delete ${isVideo ? "video" : "photo"}`}
                onClick={() => onDeletePhoto(photo.id)}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🗑️
              </button>
            )}

            {/* Favorite */}
            <button
              className={`modal-like ${isFavorite ? "liked" : ""}`}
              onClick={() => toggleFavorite(photo.id)}
            >
              {isFavorite ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageModal;
