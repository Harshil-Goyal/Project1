const LOCAL_USERS_KEY = "gs_local_users_v1";
const HANDLE_EMAIL_MAP_KEY = "gs_handle_email_map_v1";
const USER_PROFILE_MAP_KEY = "gs_user_profile_v1";

function normalizeUsername(value) {
  return (value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function loadHandleEmailMap() {
  try {
    const raw = localStorage.getItem(HANDLE_EMAIL_MAP_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveHandleEmailMap(map) {
  localStorage.setItem(HANDLE_EMAIL_MAP_KEY, JSON.stringify(map));
}

function loadUserProfileMap() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_MAP_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUserProfileMap(map) {
  localStorage.setItem(USER_PROFILE_MAP_KEY, JSON.stringify(map));
}

export function registerLocalUser({ username, email, password }) {
  const cleanEmail = normalizeEmail(email);
  const cleanUsername = (username || "").trim();
  const users = loadUsers();
  const existsEmail = users.some((u) => (u.email || "").toLowerCase() === cleanEmail);

  if (existsEmail) {
    return { ok: false, message: "Account already exists for this email" };
  }

  const user = {
    username: cleanUsername,
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  return { ok: true, user };
}

export function listLocalHandles() {
  return Object.keys(loadHandleEmailMap()).map((h) => normalizeUsername(h)).filter(Boolean);
}

export function isLocalHandleTaken(handle) {
  const cleanHandle = normalizeUsername(handle);
  if (!cleanHandle) return false;
  const map = loadHandleEmailMap();
  return Boolean(map[cleanHandle]);
}

export function linkLocalHandleToEmail({ handle, email }) {
  const cleanHandle = normalizeUsername(handle);
  const cleanEmail = normalizeEmail(email);
  if (!cleanHandle || !cleanEmail) {
    return { ok: false, message: "Invalid handle mapping data" };
  }

  const map = loadHandleEmailMap();
  const existing = normalizeEmail(map[cleanHandle] || "");
  if (existing && existing !== cleanEmail) {
    return { ok: false, message: "Username is already taken" };
  }

  map[cleanHandle] = cleanEmail;
  saveHandleEmailMap(map);
  return { ok: true };
}

export function loginLocalUser({ identifier, email, password }) {
  const rawIdentifier = identifier ?? email ?? "";
  const cleanIdentifier = String(rawIdentifier).trim().toLowerCase();
  const handleMap = loadHandleEmailMap();
  const mappedEmail = normalizeEmail(handleMap[cleanIdentifier] || "");
  const users = loadUsers();

  const user = users.find(
    (u) =>
      (
        (u.email || "").toLowerCase() === cleanIdentifier ||
        (mappedEmail && (u.email || "").toLowerCase() === mappedEmail) ||
        normalizeUsername(u.username) === cleanIdentifier
      ) &&
      u.password === password
  );

  if (!user) {
    return { ok: false, message: "Invalid username/email or password" };
  }

  return { ok: true, user };
}

export function saveLocalUserProfile({ email, personalUsername, age, birthDate }) {
  const cleanEmail = normalizeEmail(email);
  const cleanHandle = normalizeUsername(personalUsername);
  const cleanAge = Number(age);
  const cleanBirthDate = String(birthDate || "").trim();

  if (!cleanEmail || !cleanHandle || !Number.isFinite(cleanAge) || cleanAge <= 0) {
    return { ok: false, message: "Invalid profile data" };
  }

  const map = loadUserProfileMap();
  map[cleanEmail] = {
    personalUsername: cleanHandle,
    age: String(cleanAge),
    birthDate: cleanBirthDate || undefined,
    updatedAt: new Date().toISOString(),
  };
  saveUserProfileMap(map);
  return { ok: true };
}

export function getLocalUserProfile(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;
  const map = loadUserProfileMap();
  const profile = map[cleanEmail];
  if (!profile || typeof profile !== "object") return null;
  const handle = normalizeUsername(profile.personalUsername);
  const age = String(profile.age || "").trim();
  if (!handle || !age) return null;
  const birthDate = String(profile.birthDate || "").trim();
  return { personalUsername: handle, age, birthDate };
}
