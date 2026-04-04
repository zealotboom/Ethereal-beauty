import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageModal from "../components/ImageModal.jsx";
import { fetchProfile, fetchProfilePosts, getAssetUrl, updateProfile } from "../lib/api.js";
import { getOrCreateUserId } from "../lib/userIdentity.js";

const DISPLAY_NAME_KEY = "ethereal-profile-display-name";

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [editNameInput, setEditNameInput] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [profileData, postData] = await Promise.all([fetchProfile(), fetchProfilePosts()]);
        const storedDisplayName = localStorage.getItem(DISPLAY_NAME_KEY)?.trim();
        const initialName = storedDisplayName || profileData.username || "Creator";

        setProfile(profileData);
        setPosts(postData);
        setDisplayName(initialName);
        setEditNameInput(initialName);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (previewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const imagePosts = useMemo(() => posts.filter((post) => post.type === "image"), [posts]);
  const poemPosts = useMemo(() => posts.filter((post) => post.type === "poem"), [posts]);
  const contentPosts = useMemo(() => [...imagePosts, ...poemPosts], [imagePosts, poemPosts]);

  const profileImageSrc = previewImage || (profile?.profilePic ? getAssetUrl(profile.profilePic) : "");
  const postsCount = posts.length;
  const followersCount = Math.max(12, posts.length * 9 + 18);
  const followingCount = Math.max(8, poemPosts.length * 4 + 11);

  const handleLogout = () => {
    localStorage.removeItem("poetry-token");
    localStorage.removeItem("poetry-auth-email");
    localStorage.removeItem("ethereal-user-email");
    localStorage.removeItem("ethereal-user-id");
    navigate("/auth");
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setSuccessMessage("");
    setError("");

    try {
      setIsSaving(true);
      const data = await updateProfile({ profilePic: file });
      setProfile(data.user);
      setSuccessMessage(data.message || "Profile photo updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const handleSaveIdentity = () => {
    const trimmedName = editNameInput.trim();

    if (!trimmedName) {
      setError("Username cannot be empty.");
      return;
    }

    localStorage.setItem(DISPLAY_NAME_KEY, trimmedName);
    setDisplayName(trimmedName);
    setSuccessMessage("Profile updated.");
    setError("");
    setIsEditMode(false);
  };

  if (isLoading) {
    return <div className="status-card">Loading your profile...</div>;
  }

  if (error && !profile) {
    return (
      <div className="page-stack">
        <div className="status-card error">{error}</div>
        <Link className="secondary-button" to="/auth">
          Sign up or log in
        </Link>
      </div>
    );
  }

  return (
    <section className="page-stack profile-instagram-page">
      <div className="profile-instagram-shell">
        <header className="profile-instagram-header">
          <div className="profile-avatar-column">
            <button
              type="button"
              className="profile-avatar-trigger"
              onClick={handleOpenFilePicker}
              aria-label="Upload profile photo"
            >
              {profileImageSrc ? (
                <img className="profile-instagram-avatar" src={profileImageSrc} alt="Profile" />
              ) : (
                <div className="profile-instagram-avatar profile-instagram-avatar-fallback">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="profile-avatar-badge">Change photo</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handleProfileImageChange}
            />
          </div>

          <div className="profile-main-column">
            <div className="profile-title-row">
              <div className="profile-title-copy">
                <h2>{displayName}</h2>
                <p>{profile?.email}</p>
              </div>

              <div className="profile-title-actions">
                <button className="secondary-button profile-compact-button" type="button" onClick={() => setIsEditMode((current) => !current)}>
                  Edit Profile
                </button>
                <button className="secondary-button profile-compact-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>

            <div className="profile-stats-row">
              <div className="profile-stat-item">
                <strong>{postsCount}</strong>
                <span>Posts</span>
              </div>
              <div className="profile-stat-item">
                <strong>{followingCount}</strong>
                <span>Following</span>
              </div>
              <div className="profile-stat-item">
                <strong>{followersCount}</strong>
                <span>Followers</span>
              </div>
            </div>

            <div className="profile-meta-inline">
              <p><strong>Chat ID:</strong> {userId || "Not available yet"}</p>
              {profile?.interests ? <p><strong>Interests:</strong> {profile.interests}</p> : null}
              {profile?.poetryStyle ? <p><strong>Style:</strong> {profile.poetryStyle}</p> : null}
            </div>

            {isEditMode ? (
              <div className="profile-inline-editor">
                <label className="field">
                  <span>Username</span>
                  <input
                    type="text"
                    value={editNameInput}
                    onChange={(event) => setEditNameInput(event.target.value)}
                    placeholder="Enter your username"
                  />
                </label>

                <div className="profile-inline-actions">
                  <button className="primary-button profile-compact-button" type="button" onClick={handleSaveIdentity} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button className="secondary-button profile-compact-button" type="button" onClick={handleOpenFilePicker} disabled={isSaving}>
                    Upload Photo
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div className="status-card error profile-inline-status">{error}</div> : null}
            {successMessage ? <div className="status-card success profile-inline-status">{successMessage}</div> : null}
          </div>
        </header>

        <section className="profile-content-section">
          <div className="profile-content-heading">
            <div>
              <p className="section-label">Your Content</p>
              <h3>Your Posts</h3>
            </div>
          </div>

          {contentPosts.length > 0 ? (
            <div className="profile-content-grid">
              {contentPosts.map((post, index) =>
                post.type === "image" ? (
                  <button
                    key={post._id || `${post.imageUrl}-${index}`}
                    type="button"
                    className="profile-content-tile profile-image-tile"
                    onClick={() => setSelectedImage({ ...post, source: "user" })}
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.caption || "Your post"}
                      className="profile-grid-image"
                    />
                    <span className="profile-grid-badge">Image</span>
                  </button>
                ) : (
                  <article key={post._id || `${post.title}-${index}`} className="profile-content-tile profile-text-tile">
                    <span className="profile-grid-badge">Poem</span>
                    <h4>{post.title || "Untitled"}</h4>
                    <p>{post.content || "No content available."}</p>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="status-card">No content shared yet.</div>
          )}
        </section>
      </div>

      <ImageModal item={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}

export default ProfilePage;
