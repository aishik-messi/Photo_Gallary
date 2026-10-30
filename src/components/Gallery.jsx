function Gallery({
  photos,
  favorites,
  toggleFavorite,
  openModal
}) {

  return (
    <div className="gallery">

      {photos.map((photo, index) => {

        const isFavorite =
          favorites.includes(photo.id);

        return (

          <div
            className="photo-card"
            key={photo.id}
          >

            {/* Image */}
            <div
              className="image-container"
              onClick={() => openModal(photo, index)}
            >

              <img
                src={photo.image}
                alt={photo.title}
              />

              {/* Like Button */}
              <button
                className={`like-button ${
                  isFavorite ? "liked" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();

                  toggleFavorite(photo.id);
                }}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>

            </div>


            {/* Photo Information */}
            <div className="photo-info">

              <h3>
                {photo.title}
              </h3>

              <p>
                {photo.category}
              </p>

            </div>

          </div>

        );
      })}

    </div>
  );
}

export default Gallery;