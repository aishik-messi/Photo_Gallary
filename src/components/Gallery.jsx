function Gallery({
  photos,
  favorites = [],
  toggleFavorite,
  openModal,
}) {
  return (
    <div className="gallery">
      {photos.map((photo, index) => {
        const isFavorite = favorites.includes(photo.id);
        const likeCount = (photo.initialLikes || 0) + (isFavorite ? 1 : 0);

        return (
          <div className="photo-card" key={photo.id}>
            {/* Image */}
            <div
              className="image-container"
              onClick={() => openModal && openModal(photo, index)}
            >
              <img src={photo.image || photo.imageUrl} alt={photo.title || "Photo"} />

              {/* Like Button with Count */}
              <button
                className={`like-button ${isFavorite ? "liked" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (toggleFavorite) toggleFavorite(photo.id);
                }}
                title={isFavorite ? "Remove favorite" : "Add to favorites"}
                type="button"
              >
                <span>{isFavorite ? "❤️" : "🤍"}</span>
                <span className="like-count" style={{ marginLeft: "4px", fontSize: "12px", fontWeight: "700" }}>
                  {likeCount}
                </span>
              </button>
            </div>

            {/* Photo Information */}
            <div className="photo-info">
              <h3>{photo.title}</h3>
              <p>{photo.category}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Gallery;
