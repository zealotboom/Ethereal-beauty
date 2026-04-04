import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../lib/api.js";

const initialSignupForm = {
  username: "",
  email: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

function AuthPage({ isAuthenticated, authUser, onAuthChange }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup");
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");
      const data = mode === "signup" ? await signup(signupForm) : await login(loginForm);
      const nextEmail = mode === "signup" ? signupForm.email : loginForm.email;
      localStorage.setItem("poetry-token", data.token);
      localStorage.setItem("poetry-auth-email", nextEmail);
      onAuthChange?.({
        email: nextEmail,
        token: data.token,
      });
      setSuccessMessage(mode === "signup" ? "Account created successfully." : "Logged in successfully.");
      navigate("/profile");
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
          <p className="section-label">Account</p>
          <h2>{mode === "signup" ? "Create your profile" : "Log in to continue"}</h2>
        </div>
        <p className="section-copy">
          A simple username, email, and password flow that takes you straight to your profile dashboard.
        </p>
      </div>

      <div className="auth-grid">
        <form className="form-card" onSubmit={handleSubmit}>
          {!isAuthenticated ? (
            <div className="nav-links auth-toggle-row">
              <button
                className={mode === "signup" ? "primary-button" : "secondary-button"}
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccessMessage("");
                }}
              >
                Sign up
              </button>
              <button
                className={mode === "login" ? "primary-button" : "secondary-button"}
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMessage("");
                }}
              >
                Log in
              </button>
            </div>
          ) : (
            <div className="status-card success">
              Logged in as {authUser?.email || "your account"}.
            </div>
          )}

          {!isAuthenticated && mode === "signup" ? (
            <>
              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  name="username"
                  value={signupForm.username}
                  onChange={handleChange(setSignupForm)}
                  placeholder="Your username"
                  required
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={signupForm.email}
                  onChange={handleChange(setSignupForm)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={signupForm.password}
                  onChange={handleChange(setSignupForm)}
                  placeholder="Create a password"
                  required
                />
              </label>
            </>
          ) : null}

          {!isAuthenticated && mode === "login" ? (
            <>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleChange(setLoginForm)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleChange(setLoginForm)}
                  placeholder="Enter your password"
                  required
                />
              </label>
            </>
          ) : null}

          {error ? <div className="status-card error">{error}</div> : null}
          {successMessage ? <div className="status-card success">{successMessage}</div> : null}

          {!isAuthenticated ? (
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "signup"
                  ? "Creating account..."
                  : "Logging in..."
                : mode === "signup"
                  ? "Create account"
                  : "Log in"}
            </button>
          ) : null}
        </form>

        <aside className="info-card">
          <h3>Your dashboard</h3>
          <p>Update your profile details, upload a profile picture, and keep your writing identity in one place.</p>
          <p>Once logged in, new poems and images can automatically be attributed to your username.</p>
        </aside>
      </div>
    </section>
  );
}

export default AuthPage;
