import { useState } from "react";
import { createImagePost } from "../lib/api.js";

const initialImageForm = {
  caption: "",
  user: "",
  image: null,
};

function SubmitPage() {
  const [imageForm, setImageForm] = useState(initialImageForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleImageChange = (event) => {
    const { name, value, files } = event.target;

    setImageForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value,
    }));
  };

  const handleImageSubmit = async (event) => {
    event.preventDefault();

    if (!imageForm.image) {
      setError("Please choose an image to upload.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");
      await createImagePost(imageForm);
      setImageForm(initialImageForm);
      setSuccessMessage("Image uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="section-label">Explore Images</p>
          <h2>Upload visual content</h2>
        </div>
      </div>

      <form className="form-card" onSubmit={handleImageSubmit}>
        <label className="field">
          <span>Image</span>
          <input type="file" name="image" accept="image/*" onChange={handleImageChange} required />
        </label>

        <label className="field">
          <span>Caption</span>
          <input
            type="text"
            name="caption"
            value={imageForm.caption}
            onChange={handleImageChange}
            placeholder="Optional caption"
          />
        </label>

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            name="user"
            value={imageForm.user}
            onChange={handleImageChange}
            placeholder="Optional"
          />
        </label>

        {error ? <div className="status-card error">{error}</div> : null}
        {successMessage ? <div className="status-card success">{successMessage}</div> : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Uploading..." : "Upload image"}
        </button>
      </form>
    </section>
  );
}

export default SubmitPage;
