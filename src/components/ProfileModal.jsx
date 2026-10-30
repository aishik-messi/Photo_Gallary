import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl as resolveAvatar } from "../config";

function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, loading } = useAuth();

  const [username,        setUsername]        = useState("");
  const [bio,             setBio]             = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassSection, setShowPassSection] = useState(false);
  const [avatarFile,      setAvatarFile]      = useState(null);
  const [avatarPreview,   setAvatarPreview]   = useState(null);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");
  const fileInputRef = useRef(null);

  /* Sync form with current user data on open */
  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username || "");
      setBio(user.bio || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassSection(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setError("");
      setSuccess("");
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Image must be under 5 MB.");      return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) return setError("Username cannot be empty.");

    if (showPassSection && newPassword) {
      if (newPassword.length < 6)         return setError("New password must be at least 6 characters.");
      if (newPassword !== confirmPassword) return setError("Passwords do not match.");
      if (!currentPassword)               return setError("Enter your current password.");
    }

    const fd = new FormData();
    fd.append("username", username.trim());
    fd.append("bio", bio);
    if (avatarFile) fd.append("profilePicture", avatarFile);
    if (showPassSection && newPassword) {
      fd.append("currentPassword", currentPassword);
      fd.append("newPassword", newPassword);
    }

    const result = await updateProfile(fd);
    if (result.success) {
      setSuccess("Profile updated successfully!");
      setAvatarFile(null);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(onClose, 1400);
    } else {
      setError(result.error || "Update failed.");
    }
  };

  const currentAvatar = avatarPreview || resolveAvatar(user?.profilePicture);

  return (
    <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pm-modal">
        <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="pm-header">
          <h2>Edit Profile</h2>
          <p>Update your info and profile picture</p>
        </div>

        <form className="pm-form" onSubmit={handleSubmit}>

          {/* Avatar */}
          <div className="pm-avatar-section">
            <div className="pm-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="pm-avatar-img" />
              ) : (
                <div className="pm-avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="pm-avatar-overlay">
                <span>📷</span>
                <span>Change</span>
              </div>
            </div>
            <input
              id="profile-avatar"
              name="profilePicture"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <p className="pm-avatar-hint">Click to upload · Max 5 MB</p>
          </div>

          {/* Username */}
          <div className="pm-field">
            <label htmlFor="pm-username" className="pm-label">👤 Username</label>
            <input
              id="pm-username"
              name="username"
              className="pm-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              autoComplete="username"
              required
            />
          </div>

          {/* Bio */}
          <div className="pm-field">
            <label htmlFor="pm-bio" className="pm-label">📝 Bio <span className="pm-optional">(optional)</span></label>
            <textarea
              id="pm-bio"
              name="bio"
              className="pm-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Tell something about yourself…"
              autoComplete="off"
            />
            <span className="pm-char-count">{bio.length}/160</span>
          </div>

          {/* Email read-only */}
          <div className="pm-field">
            <label className="pm-label">✉️ Email <span className="pm-optional">(cannot change)</span></label>
            <input
              className="pm-input pm-input--readonly"
              type="email"
              value={user?.email || ""}
              readOnly
              tabIndex={-1}
              id="pm-email"
              name="pm-email"
            />
          </div>

          {/* Change Password toggle */}
          <button
            type="button"
            className="pm-toggle-pass"
            onClick={() => setShowPassSection((v) => !v)}
          >
            {showPassSection ? "▲ Hide Password Change" : "🔑 Change Password"}
          </button>

          {showPassSection && (
            <div className="pm-pass-section">
              <div className="pm-field">
                <label htmlFor="pm-curr-pass" className="pm-label">🔒 Current Password</label>
                <input id="pm-curr-pass" name="currentPassword" className="pm-input" type="password"
                  value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password" placeholder="Enter current password" />
              </div>
              <div className="pm-field">
                <label htmlFor="pm-new-pass" className="pm-label">🔑 New Password</label>
                <input id="pm-new-pass" name="newPassword" className="pm-input" type="password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password" placeholder="Min 6 characters" />
              </div>
              <div className="pm-field">
                <label htmlFor="pm-confirm-pass" className="pm-label">🔑 Confirm New Password</label>
                <input id="pm-confirm-pass" name="confirmPassword" className="pm-input" type="password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password" placeholder="Repeat new password" />
              </div>
            </div>
          )}

          {error   && <div className="pm-error">⚠️ {error}</div>}
          {success && <div className="pm-success">✅ {success}</div>}

          <div className="pm-actions">
            <button type="button" className="pm-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="pm-save-btn" disabled={loading || !!success}>
              {loading ? <span className="pm-spinner" /> : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
