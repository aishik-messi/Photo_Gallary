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

  const isFavorite =
    favorites.includes(photo.id);

  return (

    <div
      className="modal-overlay"
      onClick={closeModal}
    >

      <div
        className="image-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* Close Button */}
        <button
          className="close-button"
          onClick={closeModal}
        >
          ✕
        </button>


        {/* Previous Button */}
        <button
          className="modal-nav previous"
          onClick={previousPhoto}
        >
          ❮
        </button>


        {/* Image */}
        <img
          className="modal-image"
          src={photo.image}
          alt={photo.title}
        />


        {/* Next Button */}
        <button
          className="modal-nav next"
          onClick={nextPhoto}
        >
          ❯
        </button>


        {/* Information */}
        <div className="modal-info">

          <div>

            <h2>
              {photo.title}
            </h2>

            <p>
              {photo.category} {photo.location && `• 📍 ${photo.location}`} • Photo{" "}
              {currentIndex + 1} of{" "}
              {photos.length}
            </p>

          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Delete button */}
            {onDeletePhoto && (
              <button
                className="modal-delete-btn"
                title="Delete photo"
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
              className={`modal-like ${
                isFavorite ? "liked" : ""
              }`}
              onClick={() =>
                toggleFavorite(photo.id)
              }
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