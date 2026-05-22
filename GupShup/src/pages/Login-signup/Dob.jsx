import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WebsiteShell from "../Website/WebsiteShell";
import { completeUserProfile } from "../utils/profileApi";
import { clearSession, persistSession } from "../utils/session";

const USERNAME_REGEX = /^(?=.{3,20}$)(?!.*[._]{2})[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/;
function getTakenUsernames() {
  return new Set();
}

function Dob({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [personalUsername, setPersonalUsername] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [dob, setDob] = useState({
    month: "",
    day: "",
    year: "",
  });

  useEffect(() => {
  if (needsUsername) {
    const takenUsernames = getTakenUsernames();
    const storedName = localStorage.getItem("displayName") || "user";
    const nameParts = storedName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const first = nameParts[0] || "user";
    const last = nameParts[1] || "";
    const combined = `${first}${last}`.slice(0, 16) || "user";
    const random2 = () => Math.floor(10 + Math.random() * 90);
    const random3 = () => Math.floor(100 + Math.random() * 900);

    const templates = [
      () => combined,
      () => `${first}.${last || "official"}`.slice(0, 20),
      () => `its${combined}`.slice(0, 20),
      () => `${combined}${random2()}`,
      () => `${first}${new Date().getFullYear().toString().slice(-2)}`,
      () => `${first}_${last || "media"}`.slice(0, 20),
      () => `${combined}${random3()}`.slice(0, 20),
      () => `${first}.${combined}`.slice(0, 20),
    ];

    const randomSuggestions = [];
    const seen = new Set();
    let attempts = 0;

    while (randomSuggestions.length < 4 && attempts < 40) {
      attempts++;
      const candidate = templates[Math.floor(Math.random() * templates.length)]()
        .replace(/\.+$/, "")
        .replace(/_+$/, "");

      if (USERNAME_REGEX.test(candidate) && !seen.has(candidate) && !takenUsernames.has(candidate)) {
        seen.add(candidate);
        randomSuggestions.push(candidate);
      }
    }

    if (!randomSuggestions.length) {
      randomSuggestions.push(`user${Math.floor(1000 + Math.random() * 9000)}`);
    }

    setSuggestions(randomSuggestions);
  }
}, [needsUsername]);


  useEffect(() => {
    const savedUsername = localStorage.getItem("personalUsername");
    const savedAge = localStorage.getItem("age");

    if (savedUsername && savedAge) {
      setNeedsUsername(false);
      setProfileChecked(true);
      return;
    }

    if (!savedUsername || !savedAge) {
      setNeedsUsername(true);
      setProfileChecked(true);
    }
  }, []);

  const handleCloseDob = () => {
    clearSession();
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  const handleConfirm = async () => {
    setError("");

  if (!dob.month || !dob.day || !dob.year) {
    setError("Date of birth is required");
    return;
  }

  const monthIndex = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ].indexOf(dob.month);

  const selectedDate = new Date(
    dob.year,
    monthIndex,
    dob.day
  );

  if (
    selectedDate.getFullYear() != dob.year ||
    selectedDate.getMonth() != monthIndex ||
    selectedDate.getDate() != dob.day
  ) {
    setError("Invalid date selected");
    return;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.year;

  const monthDifference = today.getMonth() - monthIndex;
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.day)
  ) {
    age--;
  }

  if (age < 13) {
    setError("You must be at least 13 years old");
    return;
  }

  const cleanUsername = personalUsername.trim().toLowerCase();

  if (!cleanUsername) {
    setError("Username is required");
    return;
  }

  if (!USERNAME_REGEX.test(cleanUsername)) {
    setError("Use 3-20 chars: lowercase letters, numbers, . or _, without spaces");
    return;
  }

  const takenUsernames = getTakenUsernames();
  if (takenUsernames.has(cleanUsername)) {
    setError("Username is already taken. Try a different one.");
    return;
  }

  try {
    const birthDateIso = new Date(Number(dob.year), monthIndex, Number(dob.day)).toISOString();
    const response = await completeUserProfile({
      personalUsername: cleanUsername,
      birthDate: birthDateIso,
    });

    persistSession({
      accessToken: localStorage.getItem("token"),
      refreshToken: localStorage.getItem("refreshToken"),
      user: response.user,
    });
    setNeedsUsername(false);
    navigate("/", { replace: true });
  } catch (requestError) {
    setError(requestError.message || "Unable to complete profile");
  }
};

  return (
    <>
      {!profileChecked ? null : needsUsername ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <button
              className="close-btn"
              onClick={handleCloseDob}
              aria-label="Close"
              title="Close"
            >
              &times;
            </button>
            <h1>Create your account</h1>

            {error && <p className="error-msg">{error}</p>}

            {/* DOB */}
            <div className="dob-section">
              <label>Date of birth</label>

              <div className="dob-inputs">
                <select
                  value={dob.month}
                  onChange={(e) =>
                    setDob({ ...dob, month: e.target.value })
                  }
                >
                  <option value="">Month</option>
                  {[
                    "January","February","March","April","May","June",
                    "July","August","September","October","November","December"
                  ].map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={dob.day}
                  onChange={(e) =>
                    setDob({ ...dob, day: e.target.value })
                  }
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={dob.year}
                  onChange={(e) =>
                    setDob({ ...dob, year: e.target.value })
                  }
                >
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Username */}
            <div className="dob-section" style={{ marginTop: "0.5rem" }}>
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={personalUsername}
                onChange={(e) => setPersonalUsername(e.target.value)}
                style={{ marginTop: "0.5rem" }}
              />
            </div>

            <div className="username-suggestion-wrap">
              <p className="username-suggestion-label">Suggested handles</p>
              <div className="username-suggestion-chips">
                {suggestions.map((s, index) => (
                  <button
                    key={index}
                    type="button"
                    className="username-suggestion-chip"
                    onClick={() => setPersonalUsername(s)}
                  >
                    @{s}
                  </button>
                ))}
              </div>
            </div>


            <button
              className="primary-btn"
              style={{ marginTop: "1.25rem" }}
              onClick={handleConfirm}
            >
              Create Account
            </button>
          </div>
        </div>
      ) : (
        <WebsiteShell setIsAuthenticated={setIsAuthenticated} />
      )}
    </>
  );
}

export default Dob;

