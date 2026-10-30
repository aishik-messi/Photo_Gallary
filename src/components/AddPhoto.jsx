import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../config";

const PRESET_CATEGORIES = [
  "My Photos",
  "Nature",
  "Travel",
  "Family & Friends",
  "Portraits",
  "Food & Drinks",
  "Architecture",
  "Animals",
  "Art & Design",
  "Celebrations",
  "Sports",
  "Other",
];

function AddPhoto({ onAddPhoto }) {
  const { user, token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("My Photos");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  /* ── Image select / drag-drop ── */
  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setUploadError("");
  };

  const handleImageChange = (e) => applyFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    applyFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);

  const removeImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);

    if (!title.trim()) return setUploadError("Please enter a photo title.");
    if (!imageFile && !imagePreview) return setUploadError("Please select an image to upload.");

    const finalCategory = (customCategory.trim() || category || "My Photos").trim();

    setUploading(true);
    try {
      let createdPhoto = null;

      if (token) {
        try {
          const formData = new FormData();
          formData.append("title", title);
          formData.append("description", description);
          formData.append("category", finalCategory);
          formData.append("tags", tags);
          if (location) formData.append("location", location);
          formData.append("image", imageFile);

          const res = await fetch(`${BACKEND_URL}/api/photos`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (res.ok) {
            createdPhoto = await res.json();
          }
        } catch (serverErr) {
          console.warn("Backend upload failed, saving dynamically:", serverErr);
        }
      }

      // If backend didn't return or user is local/guest, create dynamic photo
      if (!createdPhoto) {
        createdPhoto = {
          _id: `dyn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          title: title.trim(),
          description: description.trim(),
          category: finalCategory,
          album: finalCategory,
          location: location.trim(),
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          imageUrl: imagePreview,
          image: imagePreview,
          createdAt: new Date().toISOString(),
          user: user || { username: "You" },
        };
      }

      if (onAddPhoto) {
        onAddPhoto(createdPhoto);
      }
      setUploadSuccess(true);

      /* Clear form after short delay */
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setCategory("My Photos");
        setCustomCategory("");
        setLocation("");
        setTags("");
        setImageFile(null);
        setImagePreview(null);
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1400);
    } catch (err) {
      setUploadError(err.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="ap-wrap">
      {/* Header */}
      <div className="ap-header">
        <div className="ap-header-icon">📤</div>
        <div>
          <h2 className="ap-title">Add New Photo</h2>
          <p className="ap-subtitle">
            {user ? (
              <>
                Uploading as <span className="ap-username">@{user.username}</span>
              </>
            ) : (
              "Add photo to your dynamic gallery."
            )}
          </p>
        </div>
      </div>

      <form className="ap-form" onSubmit={handleSubmit}>
        {/* ── Drop Zone ── */}
        <div
          className={`ap-dropzone${imagePreview ? " has-preview" : ""}${dragOver ? " drag-over" : ""}`}
          onClick={() => !imagePreview && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="ap-preview-img" />
              <div className="ap-preview-overlay">
                <button
                  type="button"
                  className="ap-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  🔄 Change Image
                </button>
                <button type="button" className="ap-remove-btn" onClick={removeImage}>
                  🗑️ Remove
                </button>
              </div>
            </>
          ) : (
            <div className="ap-dropzone-empty">
              <div className="ap-dz-icon">🖼️</div>
              <p className="ap-dz-text">Drag &amp; drop your photo here</p>
              <p className="ap-dz-sub">or click to browse from device</p>
              <span className="ap-dz-badge">JPG · PNG · WEBP · GIF</span>
            </div>
          )}
          <input
            id="photo-file"
            name="photo-file"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
        </div>

        {/* ── Fields grid ── */}
        <div className="ap-fields">
          {/* Title */}
          <div className="ap-field ap-field-full">
            <label className="ap-label" htmlFor="photo-title">
              📝 Title <span className="ap-required">*</span>
            </label>
            <input
              id="photo-title"
              name="title"
              className="ap-input"
              type="text"
              placeholder="e.g. Sunset over mountains, Beach day…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoComplete="off"
            />
            <span className="ap-char-count">{title.length}/80</span>
          </div>

          {/* Album / Category Select & Custom input */}
          <div className="ap-field">
            <label className="ap-label" htmlFor="photo-category">
              📁 Album / Category
            </label>
            <div className="ap-select-wrap">
              <select
                id="photo-category"
                name="category"
                className="ap-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Custom">+ Create New Album...</option>
              </select>
              <span className="ap-select-arrow">▾</span>
            </div>
            {category === "Custom" && (
              <input
                type="text"
                className="ap-input"
                style={{ marginTop: "8px" }}
                placeholder="Type new album name (e.g. Hawaii Trip 2026)…"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Location */}
          <div className="ap-field">
            <label className="ap-label" htmlFor="photo-location">
              📍 Location <span className="ap-optional">(optional)</span>
            </label>
            <input
              id="photo-location"
              name="location"
              className="ap-input"
              type="text"
              placeholder="e.g. Maui, Hawaii / Paris, France"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Description */}
          <div className="ap-field ap-field-full">
            <label className="ap-label" htmlFor="photo-description">
              💬 Description <span className="ap-optional">(optional)</span>
            </label>
            <textarea
              id="photo-description"
              name="description"
              className="ap-textarea"
              placeholder="Tell a story or add notes about this photo…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
            />
            <span className="ap-char-count">{description.length}/300</span>
          </div>

          {/* Tags */}
          <div className="ap-field ap-field-full">
            <label className="ap-label" htmlFor="photo-tags">
              🏷️ Tags <span className="ap-optional">(comma-separated)</span>
            </label>
            <input
              id="photo-tags"
              name="tags"
              className="ap-input"
              type="text"
              placeholder="e.g. nature, summer, party, vacation"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              autoComplete="off"
            />
            {tagList.length > 0 && (
              <div className="ap-tag-chips">
                {tagList.map((t, i) => (
                  <span key={i} className="ap-chip">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Feedback ── */}
        {uploadError && <div className="ap-error">⚠️ {uploadError}</div>}
        {uploadSuccess && <div className="ap-success">✅ Photo added dynamically to your gallery!</div>}

        {/* ── Submit Button ── */}
        <button type="submit" className="ap-submit" disabled={uploading || uploadSuccess}>
          {uploading ? (
            <>
              <span className="ap-spinner" /> Adding…
            </>
          ) : uploadSuccess ? (
            <>✅ Added!</>
          ) : (
            <>➕ Add to Gallery</>
          )}
        </button>
      </form>
    </div>
  );
}

export default AddPhoto;