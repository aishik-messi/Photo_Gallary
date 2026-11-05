import FullscreenLightbox from "./FullscreenLightbox";

/**
 * ImageModal wraps the modern FullscreenLightbox component.
 * Provides backwards compatibility for any legacy callers while
 * delivering the full-featured fullscreen photography lightbox experience.
 */
function ImageModal({
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
  if (!photo) return null;

  return (
    <FullscreenLightbox
      photo={photo}
      photos={photos}
      currentIndex={currentIndex}
      closeModal={closeModal}
      nextPhoto={nextPhoto}
      previousPhoto={previousPhoto}
      onSelectIndex={onSelectIndex}
      favorites={favorites}
      toggleFavorite={toggleFavorite}
      onDeletePhoto={onDeletePhoto}
    />
  );
}

export default ImageModal;
