import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../config";
import { DEFAULT_CATEGORIES } from "../data/categories";

function AddPhoto({ onAddPhoto, customCategories = [], categories = null, onAddCategory, initialCategory = "My Photos" }) {
  const { user, token } = useAuth();

  const combinedCategories = useMemo(() => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      return categories;
    }
    const list = [...DEFAULT_CATEGORIES];
    (customCategories || []).forEach((c) => {
      if (c && !list.some((item) => item.toLowerCase() === c.toLowerCase())) {
        list.push(c);
      }
    });
    return list;
  }, [categories, customCategories]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(() => {
    if (initialCategory && initialCategory !== "All Photos" && initialCategory !== "Favorites") {
      return initialCategory;
    }
    return "My Photos";
  });
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // 'image' | 'video'
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Sync when initialCategory prop changes
  useEffect(() => {
    if (initialCategory && initialCategory !== "All Photos" && initialCategory !== "Favorites") {
      if (combinedCategories.some((c) => c.toLowerCase() === initialCategory.toLowerCase())) {
        const found = combinedCategories.find((c) => c.toLowerCase() === initialCategory.toLowerCase());
        setCategory(found || initialCategory);
        setIsCustomMode(false);
        setCustomCategory("");
      } else {
        setCategory("Custom");
        setIsCustomMode(true);
        setCustomCategory(initialCategory);
      }
    }
  }, [initialCategory, combinedCategories]);

  /* ── Image/Video select / drag-drop ── */
  const applyFile = (file) => {
    if (!file) return;
    const isImg = file.type.startsWith("image/");
    const isVid = file.type.startsWith("video/");
    if (!isImg && !isVid) {
      setUploadError("Please choose a valid image or video file (JPG, PNG, WEBP, MP4, WEBM, MOV).");
      return;
    }
    setImageFile(file);
    setMediaType(isVid ? "video" : "image");

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
    setMediaType("image");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);

    if (!title.trim()) return setUploadError("Please enter a photo or video title.");
    if (!imageFile && !imagePreview) return setUploadError("Please select a photo or video to upload.");

    const finalCategory = (
      isCustomMode || category === "Custom"
        ? customCategory.trim()
        : category
    ).trim() || "My Photos";

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

      // If backend didn't return or user is local/guest, create dynamic photo/video
      if (!createdPhoto) {
        createdPhoto = {
          _id: `dyn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          title: title.trim(),
          description: description.trim(),
          category: finalCategory,
          album: finalCategory,
          mediaType: mediaType,
          location: location.trim(),
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          imageUrl: imagePreview,
          image: imagePreview,
          createdAt: new Date().toISOString(),
          user: user || { username: "You" },
        };
      } else {
        createdPhoto = {
          ...createdPhoto,
          mediaType: mediaType,
        };
      }

      // If a new custom album was specified, notify parent to add to menu
      if (finalCategory && !DEFAULT_CATEGORIES.includes(finalCategory)) {
        if (onAddCategory) {
          onAddCategory(finalCategory);
        }
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
        setIsCustomMode(false);
        setLocation("");
        setTags("");
        setImageFile(null);
        setImagePreview(null);
        setMediaType("image");
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1400);
    } catch (err) {
      setUploadError(err.message || "Failed to upload file.");
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
          <h2 className="ap-title">Add Photo or Video</h2>
          <p className="ap-subtitle">
            {user ? (
              <>
                Uploading as <span className="ap-username">@{user.username}</span>
              </>
            ) : (
              "Add photo or video to your gallery."
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
              {mediaType === "video" ? (
                <video
                  src={imagePreview}
                  className="ap-preview-img ap-preview-video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              ) : (
                <img src={imagePreview} alt="Preview" className="ap-preview-img" />
              )}
              <div className="ap-preview-overlay">
                <button
                  type="button"
                  className="ap-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  🔄 Change File
                </button>
                <button type="button" className="ap-remove-btn" onClick={removeImage}>
                  🗑️ Remove
                </button>
              </div>
            </>
          ) : (
            <div className="ap-dropzone-empty">
              <div className="ap-dz-icon">🖼️ 🎬</div>
              <p className="ap-dz-text">Drag &amp; drop your photo or video here</p>
              <p className="ap-dz-sub">or click to browse from device</p>
              <span className="ap-dz-badge">JPG · PNG · WEBP · MP4 · WEBM · MOV</span>
            </div>
          )}
          <input
            id="photo-file"
            name="photo-file"
            type="file"
            accept="image/*,video/*"
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className="ap-label" htmlFor="photo-category" style={{ margin: 0 }}>
                📁 Album / Category
              </label>
              <button
                type="button"
                className="ap-toggle-custom-btn"
                onClick={() => {
                  if (isCustomMode || category === "Custom") {
                    setIsCustomMode(false);
                    setCategory("My Photos");
                    setCustomCategory("");
                  } else {
                    setIsCustomMode(true);
                    setCategory("Custom");
                  }
                }}
              >
                {isCustomMode || category === "Custom" ? "← Pick from List" : "+ New Album"}
              </button>
            </div>

            {!(isCustomMode || category === "Custom") ? (
              <div className="ap-select-wrap">
                <select
                  id="photo-category"
                  name="category"
                  className="ap-select"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "Custom") {
                      setIsCustomMode(true);
                      setCategory("Custom");
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                >
                  <optgroup label="Select Album / Category">
                    {combinedCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <option value="Custom" style={{ fontWeight: "bold" }}>
                    + Create New Album...
                  </option>
                </select>
                <span className="ap-select-arrow">▾</span>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  className="ap-input"
                  placeholder="Type new album name (e.g. Hawaii Trip 2026)…"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  autoFocus
                  maxLength={50}
                />
                <span className="ap-optional" style={{ display: "block", marginTop: "4px", fontSize: "11.5px" }}>
                  ✨ This new album will be added to your menu automatically.
                </span>
              </div>
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
