import { useState, useEffect } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import logoNoNameLight from "./Dmgsnoname.png";
import logoNoNameDark from "./Lmgsnoname.png";
import Login from "./pages/Login-signup/Login";
import Signup from "./pages/Login-signup/Signup";
import Dob from "./pages/Login-signup/Dob";
import HelpCenter from "./pages/Helpcenter/Helpcenter";
import Privacy from "./pages/Helpcenter/Privacy";
import Terms from "./pages/Helpcenter/Terms";
import Admin from "./pages/Helpcenter/Admin";
import { getCurrentUser, googleLoginUser } from "./pages/utils/authApi";
import { clearSession, persistSession } from "./pages/utils/session";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase";

const THEME_PREF_KEY = "gs_theme_pref";

function App() {
  const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  };
  const getSavedThemePref = () => {
    const saved = localStorage.getItem(THEME_PREF_KEY);
    return saved === "dark" || saved === "light" ? saved : "device";
  };
  const resolveThemeFromPref = (pref) => {
    if (pref === "dark" || pref === "light") return pref;
    return getSystemTheme();
  };

  const [modal, setModal] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const [themePref, setThemePref] = useState(getSavedThemePref);
  const [theme, setTheme] = useState(() => resolveThemeFromPref(getSavedThemePref()));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const authPayload = await googleLoginUser(idToken);

      persistSession(authPayload);
      localStorage.removeItem("isAdminAuthenticated");

      setIsAuthenticated(true);
      setModal(null);
    } catch (requestError) {
      alert(requestError.message || "Unable to sign in with Google");
    }
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event) => {
      if (event.key !== THEME_PREF_KEY) return;
      const nextPref = event.newValue === "dark" || event.newValue === "light" ? event.newValue : "device";
      setThemePref(nextPref);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateFromSystem = () => setTheme(mediaQuery.matches ? "dark" : "light");

    if (themePref === "dark" || themePref === "light") {
      setTheme(themePref);
      return;
    }

    updateFromSystem();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateFromSystem);
      return () => mediaQuery.removeEventListener("change", updateFromSystem);
    }
    mediaQuery.addListener(updateFromSystem);
    return () => mediaQuery.removeListener(updateFromSystem);
  }, [themePref]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let isMounted = true;

    getCurrentUser()
      .then(({ user }) => {
        if (!isMounted) return;
        persistSession({
          accessToken: token,
          refreshToken: localStorage.getItem("refreshToken"),
          user,
        });
        if (user.role === "admin") {
          localStorage.setItem("isAdminAuthenticated", "true");
        }
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!isMounted) return;
        clearSession();
        setIsAuthenticated(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const homePage = (
    <>
      {!isAuthenticated && (
        <>
          <div className="layout">
            <div className="left-panel">
              <h1 className="logo">
                <img src={theme === "dark" ? logoNoNameDark : logoNoNameLight} alt="GupShup Logo" />
              </h1>
            </div>

            <div className="right-panel">
              <div className="mobile-logo">
                <img className="grey" src={logoNoNameLight} alt="GupShup Logo" />
                <img className="white" src={logoNoNameDark} alt="GupShup Logo" />
              </div>

              <h1>What's up?</h1>
              <h2>Let's share on GupShup!</h2>

              <br />

              <button className="google-btn" onClick={handleGoogleSignup}>
                <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.23 9.22 3.62l6.88-6.88C35.98 2.39 30.45 0 24 0 14.62 0 6.54 5.38 2.69 13.22l8.02 6.23C12.83 13.02 17.95 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.55-.14-3.04-.4-4.5H24v8.52h12.7c-.55 2.98-2.2 5.5-4.7 7.2l7.2 5.58c4.2-3.88 6.3-9.6 6.3-16.8z"/>
                  <path fill="#FBBC05" d="M10.71 28.45c-.52-1.55-.82-3.2-.82-4.95s.3-3.4.82-4.95l-8.02-6.23C1 15.78 0 19.77 0 23.5s1 7.72 2.69 11.18l8.02-6.23z"/>
                  <path fill="#34A853" d="M24 47c6.45 0 11.98-2.14 15.97-5.8l-7.2-5.58c-2 1.35-4.56 2.15-8.77 2.15-6.05 0-11.17-3.52-13.29-8.45l-8.02 6.23C6.54 42.62 14.62 47 24 47z"/>
                </svg>
                Sign up with Google
              </button>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <button className="primary-btn" onClick={() => setModal("signup")}>
                Create account
              </button>

              <p className="signup-legal-text">
                By signing up, you agree to the{" "}
                <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and{" "}
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>. Need help? Visit our{" "}
                <Link to="/help-center" target="_blank" rel="noopener noreferrer">Help Center</Link>.
              </p>

              <br />
              <h4>Already have an account?</h4>

              <button className="secondary-btn" onClick={() => setModal("login")}>
                Sign in
              </button>

              <p className="auth-copyright">&copy; 2026 GupShup</p>
            </div>
          </div>

          {modal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <button className="close-btn" onClick={() => setModal(null)} aria-label="Close" title="Close">
                  ×
                </button>

                {modal === "login" ? (
                  <Login setModal={setModal} setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <Signup
                    setModal={setModal}
                    prefillData={prefillData}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {isAuthenticated && <Dob setIsAuthenticated={setIsAuthenticated} />}
    </>
  );

  return (
    <Routes>
      <Route path="/" element={homePage} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/admin"
        element={
          localStorage.getItem("isAdminAuthenticated") === "true"
            ? <Admin />
            : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

