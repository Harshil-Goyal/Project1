import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, googleLoginUser } from "../utils/authApi";
import { persistSession } from "../utils/session";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

function Login({ setModal, setIsAuthenticated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigateAfterLogin = () => {
    navigate("/", { replace: true });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    if (!form.identifier || !form.password)
      return "All fields are required";

    return null;
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const authPayload = await googleLoginUser(idToken);

      persistSession(authPayload);
      localStorage.removeItem("isAdminAuthenticated");

      if (authPayload.user.role === "admin") {
        localStorage.setItem("isAdminAuthenticated", "true");
        setIsAuthenticated(true);
        setModal(null);
        navigate("/admin");
        return;
      }

      setIsAuthenticated(true);
      setModal(null);
      navigateAfterLogin();
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in with Google");
    }
  };

  const handleForgotPassword = () => {
    setError("Password reset isn't configured yet.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validate();
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    try {
      const authPayload = await loginUser({
        identifier: form.identifier.trim().toLowerCase(),
        password: form.password,
      });

      persistSession(authPayload);
      localStorage.removeItem("isAdminAuthenticated");

      if (authPayload.user.role === "admin") {
        localStorage.setItem("isAdminAuthenticated", "true");
        setIsAuthenticated(true);
        setModal(null);
        navigate("/admin");
        return;
      }

      setIsAuthenticated(true);
      setModal(null);
      navigateAfterLogin();
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in");
    }
  };

  return (
    <div className="form-card">
      <h1 className="form-title">Sign in to GupShup</h1>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="identifier"
          placeholder="Email or username"
          value={form.identifier}
          onChange={handleChange}
        />

        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <div className="show-password-wrap">
          <label>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show Password
          </label>
        </div>


        <button type="submit" className="primary-btn submit-gap">
          Login
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

        <button type="button" className="auth-link" onClick={handleForgotPassword}>
          Forgot password?
        </button>
      </form>

      <p>
        Don't have an account?{" "}
        <span
          className="auth-switch"
          onClick={() => setModal("signup")}
        >
          Signup
        </span>
      </p>
    </div>
  );
}

export default Login;
