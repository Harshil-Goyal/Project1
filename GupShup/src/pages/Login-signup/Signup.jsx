import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { registerUser, googleLoginUser } from "../utils/authApi";
import { persistSession } from "../utils/session";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

function Signup({ setModal, prefillData, setIsAuthenticated }) {
  const [form, setForm] = useState({
    username: prefillData?.username || "",
    email: prefillData?.email || "",
    password: "",
    confirmPassword: "",
    month: "",
    day: "",
    year: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const name = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!name || !email || !password || !confirmPassword) {
      return "All fields are required";
    }

    if (name.length < 2 || name.length > 40) {
      return "Name must be 2-40 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Email is invalid";
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!strongPassword.test(password)) {
      return "Password must be at least 8 characters, include uppercase, lowercase, number and special character";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const authPayload = await googleLoginUser(idToken);

      persistSession(authPayload);
      localStorage.removeItem("isAdminAuthenticated");

      setModal(null);
      setIsAuthenticated(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in with Google");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validate();
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    try {
      const cleanName = form.username.trim();
      const cleanEmail = form.email.trim().toLowerCase();
      const cleanPassword = form.password.trim();
      const authPayload = await registerUser({
        username: cleanName,
        email: cleanEmail,
        password: cleanPassword,
      });

      persistSession(authPayload);
      localStorage.removeItem("isAdminAuthenticated");
      setModal(null);
      setIsAuthenticated(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to create account");
    }
  };

  return (
    <div className="form-card">
      <h1 className="form-title">Create your account</h1>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Name"
          value={form.username}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="tall-input"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </div>

        <small className="suggestUserName-a">
          Must contain 8+ characters, uppercase, lowercase, number & special character.
        </small>

        <div className="password-field password-field-spaced">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="password-toggle"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <br />

        <button type="submit" className="primary-btn">
          Next...
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleAuth}>
          <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.23 9.22 3.62l6.88-6.88C35.98 2.39 30.45 0 24 0 14.62 0 6.54 5.38 2.69 13.22l8.02 6.23C12.83 13.02 17.95 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.55-.14-3.04-.4-4.5H24v8.52h12.7c-.55 2.98-2.2 5.5-4.7 7.2l7.2 5.58c4.2-3.88 6.3-9.6 6.3-16.8z"/>
            <path fill="#FBBC05" d="M10.71 28.45c-.52-1.55-.82-3.2-.82-4.95s.3-3.4.82-4.95l-8.02-6.23C1 15.78 0 19.77 0 23.5s1 7.72 2.69 11.18l8.02-6.23z"/>
            <path fill="#34A853" d="M24 47c6.45 0 11.98-2.14 15.97-5.8l-7.2-5.58c-2 1.35-4.56 2.15-8.77 2.15-6.05 0-11.17-3.52-13.29-8.45l-8.02 6.23C6.54 42.62 14.62 47 24 47z"/>
          </svg>
          Sign in with Google
        </button>

      </form>
    </div>
  );
}

export default Signup;
