import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Globe,
  HelpCircle,
  KeyRound,
  Palette,
  Search,
  ShieldOff,
  ShieldCheck,
  Lock,
  LogOut,
  Smartphone,
  Users,
  UserRound,
} from "lucide-react";
import { SectionState } from "../WebsiteUI";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { fetchSettingsCategories } from "../services/websiteApi";
import { changeUserPassword, logoutUser } from "../../utils/authApi";
import { updateUserProfile } from "../../utils/profileApi";
import { clearSession } from "../../utils/session";

const SETTINGS_STORAGE_KEY = "ws_settings_prefs_v1";
const THEME_PREF_KEY = "gs_theme_pref";
const SESSION_STORE_KEY = "gs_session_devices_v1";
const MUTED_STORE_KEY = "gs_muted_accounts_v1";
const BLOCKED_STORE_KEY = "gs_blocked_accounts_v1";
const RESTRICTED_STORE_KEY = "gs_restricted_accounts_v1";
const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Switzerland",
  "Austria",
  "Belgium",
  "Portugal",
  "Poland",
  "Czech Republic",
  "Greece",
  "Turkey",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "South Africa",
  "Egypt",
  "Nigeria",
  "Kenya",
  "Japan",
  "South Korea",
  "Singapore",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "China",
  "Hong Kong",
  "Taiwan",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Other",
];
const GENDER_OPTIONS = ["Not set", "Male", "Female", "Non-binary", "Prefer not to say", "Other"];

function readStoreArray(key, fallback = []) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStoreArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toBirthDateLabel(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function toAgeFromISO(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

function normalizePhone(rawPhone) {
  return String(rawPhone || "")
    .trim()
    .replace(/[()\-\s]/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function readCurrentAccountInfo({ privateAccount = false } = {}) {
  const username = localStorage.getItem("personalUsername") || "Not set";
  const age = localStorage.getItem("age") || "Not set";
  const email = localStorage.getItem("userEmail") || "Not set";
  const phone = localStorage.getItem("userPhone") || "+919555469214";
  const gender = localStorage.getItem("userGender") || "Not set";
  const country = localStorage.getItem("userCountry") || "India";
  const languages = localStorage.getItem("userLanguages") || "English, Hindi";
  const birthDate = localStorage.getItem("userBirthDate") || "Not set";
  const usernameLabel = username === "Not set" ? "Not set" : `@${username}`;

  let createdAt = "Not set";
  try {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (currentUser?.createdAt) {
      const date = new Date(currentUser.createdAt);
      if (!Number.isNaN(date.getTime())) {
        createdAt = date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });
      }
    }
  } catch {
    // ignore malformed local data
  }

  return [
    { kind: "account", title: "Username", subtitle: usernameLabel, chevron: true, action: true },
    { kind: "account", title: "Phone", subtitle: phone, chevron: true, action: true },
    { kind: "account", title: "Email", subtitle: email, chevron: true, action: true },
    { kind: "account", title: "Account creation", subtitle: createdAt, secondary: `${country} (frontend session)`, dividerTop: true },
    { kind: "account", title: "Country", subtitle: country, chevron: true, action: true, dividerTop: true },
    { kind: "account", title: "Languages", subtitle: languages, chevron: true, action: true },
    { kind: "account", title: "Gender", subtitle: gender, chevron: true, action: true },
    { kind: "account", title: "Birth date", subtitle: birthDate, secondary: "Change your date of birth on your profile.", chevron: true, action: true },
    { kind: "account", title: "Age", subtitle: String(age), chevron: true, action: true },
  ];
}

function SettingsSection() {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("Account Information");
  const [prefs, setPrefs] = useState({
    push: true,
    email: false,
    mentionsOnly: true,
    likes: true,
    comments: true,
    newFollowers: true,
    dmRequests: true,
    privateAccount: false,
    twoStepVerification: false,
    allowTags: true,
    highContrast: false,
  });
  const [activeDetail, setActiveDetail] = useState(null);
  const [themePref, setThemePref] = useState(() => localStorage.getItem(THEME_PREF_KEY) || "device");
  const [detailNotice, setDetailNotice] = useState("");
  const [detailNoticeType, setDetailNoticeType] = useState("success");
  const [detailFieldValue, setDetailFieldValue] = useState("");
  const [detailDateValue, setDetailDateValue] = useState("");
  const [detailInitialValue, setDetailInitialValue] = useState("");
  const [detailInitialDateValue, setDetailInitialDateValue] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [relationInput, setRelationInput] = useState("");
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deviceSessions, setDeviceSessions] = useState(() =>
    readStoreArray(SESSION_STORE_KEY, [
      { id: "s1", device: "Web - Chrome (Windows)", current: true, lastSeen: "Active now" },
      { id: "s2", device: "Android App", current: false, lastSeen: "2h ago" },
      { id: "s3", device: "iPad Safari", current: false, lastSeen: "Yesterday" },
    ])
  );
  const [mutedAccounts, setMutedAccounts] = useState(() => readStoreArray(MUTED_STORE_KEY, ["@spamwave"]));
  const [blockedAccounts, setBlockedAccounts] = useState(() => readStoreArray(BLOCKED_STORE_KEY, []));
  const [restrictedAccounts, setRestrictedAccounts] = useState(() => readStoreArray(RESTRICTED_STORE_KEY, []));

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useAsyncResource(
    fetchSettingsCategories,
    []
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
      if (saved && typeof saved === "object") {
        setPrefs((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      // ignore bad saved settings
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (prefs.highContrast) {
      document.body.classList.add("ws-high-contrast");
    } else {
      document.body.classList.remove("ws-high-contrast");
    }
  }, [prefs.highContrast]);

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categories;
    return categories.filter((item) => item.toLowerCase().includes(normalizedSearch));
  }, [categories, normalizedSearch]);

  useEffect(() => {
    if (!filteredCategories.length) return;
    if (!filteredCategories.includes(activeCategory)) {
      setActiveCategory(filteredCategories[0]);
    }
  }, [filteredCategories, activeCategory]);

  useEffect(() => {
    setActiveDetail(null);
    setDetailNotice("");
  }, [activeCategory]);

  useEffect(() => {
    writeStoreArray(SESSION_STORE_KEY, deviceSessions);
  }, [deviceSessions]);

  useEffect(() => {
    writeStoreArray(MUTED_STORE_KEY, mutedAccounts);
  }, [mutedAccounts]);

  useEffect(() => {
    writeStoreArray(BLOCKED_STORE_KEY, blockedAccounts);
  }, [blockedAccounts]);

  useEffect(() => {
    writeStoreArray(RESTRICTED_STORE_KEY, restrictedAccounts);
  }, [restrictedAccounts]);

  const rightPanel = useMemo(() => {
    if (activeCategory === "Account Information") {
      return {
        heading: "Account Information",
        subtitle: "Manage your basic account details and personal profile information.",
        items: readCurrentAccountInfo({ privateAccount: prefs.privateAccount }),
      };
    }

    if (activeCategory === "Notifications") {
      return {
        heading: "Notifications",
        subtitle: "Control how and when GupShup notifies you across devices.",
        items: [
          { kind: "toggle", title: "Push notifications", subtitle: "Alerts on your phone and desktop.", key: "push", Icon: Bell },
          { kind: "toggle", title: "Email updates", subtitle: "Product updates and account activity in email.", key: "email", Icon: Download },
          { kind: "toggle", title: "Mentions only", subtitle: "Only notify when someone mentions you.", key: "mentionsOnly", Icon: Eye },
          { kind: "toggle", title: "Likes notifications", subtitle: "Get notified when someone likes your posts.", key: "likes", Icon: Bell },
          { kind: "toggle", title: "Comments notifications", subtitle: "Get notified on comments and replies.", key: "comments", Icon: Bell },
          { kind: "toggle", title: "New followers", subtitle: "See alerts when new users follow you.", key: "newFollowers", Icon: Users },
          { kind: "toggle", title: "Message requests", subtitle: "Notify for new DM requests.", key: "dmRequests", Icon: Smartphone },
        ],
      };
    }

    if (activeCategory === "Password and security") {
      return {
        heading: "Password and Security",
        subtitle: "Manage your sign-in protection and active account access.",
        items: [
          { kind: "link", title: "Change password", subtitle: "Update your password anytime for account safety.", Icon: KeyRound },
          { kind: "toggle", title: "2-step verification", subtitle: "Add an extra verification layer for login.", key: "twoStepVerification", Icon: ShieldCheck },
          {
            kind: "action",
            title: "Currently logged in sessions",
            subtitle: "Web - Chrome (Windows) | Mobile - Android (2 active sessions).",
            Icon: Smartphone,
            notice: "Frontend mode: session list preview only. Backend session service will power real device controls.",
          },
          {
            kind: "action",
            title: "Log out all other sessions",
            subtitle: "Sign out from all devices except this one.",
            Icon: LogOut,
            notice: "Frontend mode: logout-all simulated. Connect auth backend to revoke active tokens.",
          },
          {
            kind: "action",
            title: "Deactivate account",
            subtitle: "Temporarily disable your profile and public account visibility.",
            Icon: ShieldOff,
            danger: true,
          },
        ],
      };
    }

    if (activeCategory === "Account privacy") {
      return {
        heading: "Account Privacy",
        subtitle: "Control who can discover, interact with, and view your account.",
        items: [
          { kind: "toggle", title: "Private your account", subtitle: "Limit profile and post visibility to approved people.", key: "privateAccount", Icon: Lock },
          { kind: "link", title: "Muted accounts", subtitle: "Manage accounts you have muted.", Icon: Bell },
          { kind: "link", title: "Blocked accounts", subtitle: "Review users you blocked from interacting with you.", Icon: ShieldOff },
          { kind: "link", title: "Restricted accounts", subtitle: "See accounts with limited interactions.", Icon: Users },
          { kind: "toggle", title: "Allow tagging", subtitle: "Let other users tag your account in posts.", key: "allowTags", Icon: UserRound },
        ],
      };
    }

    if (activeCategory === "Accessibility and display") {
      return {
        heading: "Accessibility and Display",
        subtitle: "Tune visual readability and choose your preferred theme mode.",
        items: [
          { kind: "toggle", title: "High contrast mode", subtitle: "Increase contrast for better readability.", key: "highContrast", Icon: Palette },
          { kind: "theme-mode", title: "Display theme", subtitle: "Choose dark, light, or follow your device setting.", Icon: Globe },
        ],
      };
    }

    if (activeCategory === "Additional resources") {
      return {
        heading: "Additional Resources",
        subtitle: "Helpful links to policies and support resources.",
        items: [
          { kind: "redirect", title: "Terms of Service", subtitle: "Read platform rules and legal terms.", Icon: Globe, path: "/terms" },
          { kind: "redirect", title: "Privacy Policy", subtitle: "Review how your data is handled.", Icon: ShieldOff, path: "/privacy-policy" },
          { kind: "redirect", title: "Contact Us", subtitle: "Get support by email.", Icon: HelpCircle, href: "mailto:support@yourchatapp.com" },
          { kind: "redirect", title: "Report a bug", subtitle: "Tell us about issues you find.", Icon: Download, path: "/help-center?report=1" },
        ],
      };
    }

    return {
      heading: "Additional Resources",
      subtitle: "Helpful links to policies and support resources.",
      items: [
        { kind: "redirect", title: "Terms of Service", subtitle: "Read platform rules and legal terms.", Icon: Globe, path: "/terms" },
        { kind: "redirect", title: "Privacy Policy", subtitle: "Review how your data is handled.", Icon: ShieldOff, path: "/privacy-policy" },
        { kind: "redirect", title: "Contact Us", subtitle: "Get support by email.", Icon: HelpCircle, href: "mailto:support@yourchatapp.com" },
        { kind: "redirect", title: "Report a bug", subtitle: "Tell us about issues you find.", Icon: Download, path: "/help-center?report=1" },
      ],
    };
  }, [activeCategory, prefs.privateAccount]);

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openInNewTab = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getDetailContent = (title) => {
    const contentByTitle = {
      Username: ["Update your username locally for this frontend session."],
      Phone: ["Update your phone number locally for this frontend session."],
      Email: ["Update your account email locally (frontend only)."],
      Country: ["Set your country preference."],
      Languages: ["Set one or more preferred languages (comma separated)."],
      Gender: ["Set your profile gender preference."],
      "Birth date": ["Set your birth date. Age will auto-update."],
      Age: ["Age is calculated from your birth date."],
      "Change password": ["Update your local account password now."],
      "2-step verification": ["Toggle 2-step verification from the previous screen."],
      "Currently logged in sessions": ["Manage active frontend sessions on this device list."],
      "Log out all other sessions": ["Use the button below to keep only your current session."],
      "Muted accounts": ["Add/remove muted handles in frontend storage."],
      "Blocked accounts": ["Add/remove blocked handles in frontend storage."],
      "Restricted accounts": ["Add/remove restricted handles in frontend storage."],
    };
    return contentByTitle[title] || ["This section is active in frontend."];
  };

  const getDetailFeature = (title) => {
    const map = {
      Username: "edit_username",
      Phone: "edit_phone",
      Email: "edit_email",
      Country: "edit_country",
      Languages: "edit_languages",
      Gender: "edit_gender",
      "Birth date": "edit_birth_date",
      Age: "view_age",
      "Change password": "change_password",
      "Currently logged in sessions": "sessions",
      "Log out all other sessions": "logout_others",
      "Muted accounts": "muted_accounts",
      "Blocked accounts": "blocked_accounts",
      "Restricted accounts": "restricted_accounts",
    };
    return map[title] || "info";
  };

  const onDetailAction = (item) => {
    if (item.path) {
      openInNewTab(item.path);
      return;
    }
    if (item.href) {
      openInNewTab(item.href);
      return;
    }
    if (item.title === "Deactivate account") {
      const displayName = localStorage.getItem("displayName") || "GupShup User";
      const username = localStorage.getItem("personalUsername") || "user";
      setActiveDetail({
        title: item.title,
        subtitle: "Temporarily disable your profile and public account visibility.",
        danger: true,
        type: "deactivate",
        profile: {
          displayName,
          username: `@${username}`,
          avatarInitial: displayName.slice(0, 1).toUpperCase(),
        },
        content: [
          "You're about to start the process of deactivating your account. Your display name, @username, and public profile will no longer be viewable.",
        ],
      });
      return;
    }

    const feature = getDetailFeature(item.title);
    let fieldValue = "";
    if (feature === "edit_username") fieldValue = localStorage.getItem("personalUsername") || "";
    if (feature === "edit_phone") fieldValue = localStorage.getItem("userPhone") || "";
    if (feature === "edit_email") fieldValue = localStorage.getItem("userEmail") || "";
    if (feature === "edit_country") fieldValue = localStorage.getItem("userCountry") || "India";
    if (feature === "edit_languages") fieldValue = localStorage.getItem("userLanguages") || "";
    if (feature === "edit_gender") fieldValue = localStorage.getItem("userGender") || "Not set";
    if (feature === "edit_birth_date") {
      const saved = localStorage.getItem("userBirthDate");
      if (saved) {
        const parsed = new Date(saved);
        if (!Number.isNaN(parsed.getTime())) {
          fieldValue = parsed.toISOString().slice(0, 10);
        }
      }
    }
    setDetailFieldValue(fieldValue);
    setDetailDateValue(fieldValue);
    setDetailInitialValue(fieldValue);
    setDetailInitialDateValue(fieldValue);
    setCountryFilter("");
    setRelationInput("");
    setDetailNotice("");
    setDetailNoticeType("success");
    setChangePasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setActiveDetail({
      title: item.title,
      subtitle: item.subtitle,
      content: item.notice ? [item.notice] : getDetailContent(item.title),
      danger: Boolean(item.danger),
      feature,
    });
  };

  const onDeactivateAccount = () => {
    logoutUser(localStorage.getItem("refreshToken")).catch(() => {});
    clearSession();
    window.location.href = "/";
  };

  const pushDetailNotice = (message, type = "success") => {
    setDetailNotice(message);
    setDetailNoticeType(type);
  };

  const hasUnsavedDetailChanges = () => {
    if (!activeDetail?.feature) return false;
    if (activeDetail.feature === "change_password") {
      return Boolean(
        changePasswordForm.currentPassword || changePasswordForm.newPassword || changePasswordForm.confirmPassword
      );
    }
    if (activeDetail.feature === "edit_birth_date") {
      return detailDateValue !== detailInitialDateValue;
    }
    if (
      [
        "edit_username",
        "edit_phone",
        "edit_email",
        "edit_country",
        "edit_languages",
        "edit_gender",
      ].includes(activeDetail.feature)
    ) {
      return detailFieldValue !== detailInitialValue;
    }
    if (["muted_accounts", "blocked_accounts", "restricted_accounts"].includes(activeDetail.feature)) {
      return Boolean(relationInput.trim());
    }
    return false;
  };

  const onBackFromDetail = () => {
    if (hasUnsavedDetailChanges()) {
      const shouldLeave = window.confirm("You have unsaved changes. Discard and go back?");
      if (!shouldLeave) return;
    }
    setActiveDetail(null);
  };

  const saveSimpleField = async (storageKey, value, successMessage, validationRule, normalizeValue) => {
    const cleaned = (normalizeValue ? normalizeValue(value) : value).trim();
    if (!cleaned) {
      pushDetailNotice("This field cannot be empty.", "error");
      return;
    }
    if (validationRule) {
      const validationError = validationRule(cleaned);
      if (validationError) {
        pushDetailNotice(validationError, "error");
        return;
      }
    }
    const fieldMap = {
      personalUsername: "username",
      userPhone: "phone",
      userEmail: "email",
      userCountry: "country",
      userLanguages: "languages",
      userGender: "gender",
    };

    try {
      const payload = { [fieldMap[storageKey]]: cleaned };
      const response = await updateUserProfile(payload);
      localStorage.setItem(storageKey, cleaned);
      localStorage.setItem("displayName", response.user.name || "");
      localStorage.setItem("personalUsername", response.user.username || "");
      localStorage.setItem("userEmail", response.user.email || "");
      localStorage.setItem("userPhone", response.user.phone || "");
      localStorage.setItem("userGender", response.user.gender || "Not set");
      localStorage.setItem("userCountry", response.user.country || "India");
      localStorage.setItem("userLanguages", response.user.languages || "English, Hindi");
      localStorage.setItem("user", JSON.stringify(response.user));
      setDetailFieldValue(cleaned);
      setDetailInitialValue(cleaned);
      pushDetailNotice(successMessage, "success");
    } catch (error) {
      pushDetailNotice(error.message || "Unable to update this field.", "error");
    }
  };

  const onSaveBirthDate = async () => {
    if (!detailDateValue) {
      pushDetailNotice("Please select a valid birth date.", "error");
      return;
    }
    const label = toBirthDateLabel(detailDateValue);
    if (!label) {
      pushDetailNotice("Invalid birth date.", "error");
      return;
    }
    try {
      const response = await updateUserProfile({ birthDate: detailDateValue });
      localStorage.setItem("userBirthDate", label);
      if (response.user.age !== null && response.user.age !== undefined) {
        localStorage.setItem("age", String(response.user.age));
      }
      localStorage.setItem("user", JSON.stringify(response.user));
      setDetailInitialDateValue(detailDateValue);
      pushDetailNotice("Birth date updated.", "success");
    } catch (error) {
      pushDetailNotice(error.message || "Unable to update birth date.", "error");
    }
  };

  const onSavePassword = async (event) => {
    event.preventDefault();
    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      pushDetailNotice("Fill all password fields.", "error");
      return;
    }

    try {
      await changeUserPassword(changePasswordForm);
      setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      pushDetailNotice("Password updated successfully.", "success");
    } catch (error) {
      pushDetailNotice(error.message || "Unable to update password.", "error");
    }
  };

  const onLogoutOtherSessions = () => {
    setDeviceSessions((prev) => prev.filter((session) => session.current));
    pushDetailNotice("Logged out all other sessions.", "success");
  };

  const addRelationHandle = (type) => {
    const value = relationInput.trim().toLowerCase();
    if (!value) return;
    const normalized = value.startsWith("@") ? value : `@${value}`;
    if (type === "muted" && !mutedAccounts.includes(normalized)) setMutedAccounts((prev) => [...prev, normalized]);
    if (type === "blocked" && !blockedAccounts.includes(normalized)) setBlockedAccounts((prev) => [...prev, normalized]);
    if (type === "restricted" && !restrictedAccounts.includes(normalized)) setRestrictedAccounts((prev) => [...prev, normalized]);
    setRelationInput("");
    pushDetailNotice("List updated.", "success");
  };

  const removeRelationHandle = (type, handle) => {
    if (type === "muted") setMutedAccounts((prev) => prev.filter((item) => item !== handle));
    if (type === "blocked") setBlockedAccounts((prev) => prev.filter((item) => item !== handle));
    if (type === "restricted") setRestrictedAccounts((prev) => prev.filter((item) => item !== handle));
  };

  const applyThemePreference = (mode) => {
    const next = mode === "dark" || mode === "light" ? mode : "device";
    setThemePref(next);
    localStorage.setItem(THEME_PREF_KEY, next);
    if (next === "device") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.className = prefersDark ? "dark" : "light";
      if (prefs.highContrast) document.body.classList.add("ws-high-contrast");
      return;
    }
    document.body.className = next;
    if (prefs.highContrast) document.body.classList.add("ws-high-contrast");
  };

  return (
    <section className="ws-settings-page">
      <div className="ws-settings-left">
        <h1 className="ws-settings-title">Settings</h1>
        <div className="ws-searchbar">
          <Search size={18} />
          <input
            className="ws-search-input"
            type="search"
            placeholder="Search settings"
            aria-label="Search settings"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
        <SectionState
          isLoading={categoriesLoading}
          error={categoriesError}
          isEmpty={!filteredCategories.length}
          emptyText="No settings categories."
        />
        <div className="ws-settings-list">
          {filteredCategories.map((item) => (
            <button
              key={item}
              type="button"
              className={`ws-settings-item ${activeCategory === item ? "active" : ""}`}
              onClick={() => {
                if (item === "Help Center") {
                  openInNewTab("/help-center");
                  return;
                }
                setActiveCategory(item);
              }}
            >
              <span>{item}</span>
              {item === "Help Center" ? (
                <ArrowUpRight size={18} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="ws-settings-right">
        {activeDetail ? (
          <>
            <div className="ws-settings-detail-head">
              <button
                type="button"
                className="ws-settings-inline-back"
                aria-label="Back"
                onClick={onBackFromDetail}
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="ws-settings-heading ws-settings-detail-heading">{activeDetail.title}</h2>
            </div>
            {activeDetail.subtitle ? <p className="ws-settings-subtitle">{activeDetail.subtitle}</p> : null}
          </>
        ) : (
          <>
            <h2 className="ws-settings-heading">{rightPanel.heading}</h2>
            {rightPanel.subtitle ? <p className="ws-settings-subtitle">{rightPanel.subtitle}</p> : null}
          </>
        )}
        <SectionState
          isLoading={false}
          error={null}
          isEmpty={!rightPanel.items.length}
          emptyText="No account details."
        />
        {activeDetail ? (
          <div className="ws-settings-detail-view">
            <div className="ws-settings-detail-body">
              {activeDetail.type === "deactivate" ? (
                <>
                  <article className="ws-deactivate-profile">
                    <div className="ws-deactivate-avatar">{activeDetail.profile.avatarInitial}</div>
                    <div className="ws-deactivate-meta">
                      <strong>{activeDetail.profile.displayName}</strong>
                      <span>{activeDetail.profile.username}</span>
                    </div>
                  </article>
                  <h3 className="ws-deactivate-title">This will deactivate your account</h3>
                </>
              ) : null}
              {activeDetail.content.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {activeDetail.feature === "change_password" ? (
                <form className="ws-settings-form" onSubmit={onSavePassword}>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={changePasswordForm.currentPassword}
                    onChange={(e) => setChangePasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={changePasswordForm.newPassword}
                    onChange={(e) => setChangePasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={changePasswordForm.confirmPassword}
                    onChange={(e) => setChangePasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <button type="submit" className="ws-settings-inline-action">Update password</button>
                </form>
              ) : null}

              {activeDetail.feature === "edit_username" ? (
                <div className="ws-settings-form">
                  <input
                    value={detailFieldValue}
                    onChange={(e) => {
                      setDetailFieldValue(e.target.value);
                      setDetailNotice("");
                    }}
                    placeholder="Username"
                  />
                  <button
                    type="button"
                    className="ws-settings-inline-action"
                    onClick={() =>
                      saveSimpleField(
                        "personalUsername",
                        detailFieldValue,
                        "Username updated.",
                        (value) =>
                          /^[a-zA-Z0-9._]{3,20}$/.test(value)
                            ? ""
                            : "Use 3-20 characters (letters, numbers, underscore, dot)."
                      )
                    }
                  >
                    Save username
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "edit_phone" ? (
                <div className="ws-settings-form">
                  <input
                    value={detailFieldValue}
                    onChange={(e) => {
                      setDetailFieldValue(e.target.value);
                      setDetailNotice("");
                    }}
                    placeholder="Phone number"
                  />
                  <button
                    type="button"
                    className="ws-settings-inline-action"
                    onClick={() =>
                      saveSimpleField(
                        "userPhone",
                        detailFieldValue,
                        "Phone number updated.",
                        (value) => (/^\+?[0-9]{8,15}$/.test(value) ? "" : "Enter a valid phone number (8-15 digits)."),
                        normalizePhone
                      )
                    }
                  >
                    Save phone
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "edit_email" ? (
                <div className="ws-settings-form">
                  <input
                    value={detailFieldValue}
                    onChange={(e) => {
                      setDetailFieldValue(e.target.value);
                      setDetailNotice("");
                    }}
                    placeholder="Email"
                    type="email"
                  />
                  <button
                    type="button"
                    className="ws-settings-inline-action"
                    onClick={() =>
                      saveSimpleField(
                        "userEmail",
                        detailFieldValue,
                        "Email updated.",
                        (value) => (isValidEmail(value) ? "" : "Enter a valid email address.")
                      )
                    }
                  >
                    Save email
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "edit_country" ? (
                <div className="ws-settings-form">
                  <input
                    value={countryFilter}
                    onChange={(e) => {
                      setCountryFilter(e.target.value);
                      setDetailNotice("");
                    }}
                    placeholder="Search country"
                  />
                  <select
                    value={detailFieldValue || "India"}
                    onChange={(e) => {
                      setDetailFieldValue(e.target.value);
                      setDetailNotice("");
                    }}
                    aria-label="Select country"
                  >
                    {COUNTRY_OPTIONS.filter((country) =>
                      country.toLowerCase().includes(countryFilter.trim().toLowerCase())
                    ).length ? (
                      COUNTRY_OPTIONS.filter((country) =>
                        country.toLowerCase().includes(countryFilter.trim().toLowerCase())
                      ).map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No matching country
                      </option>
                    )}
                  </select>
                  <button type="button" className="ws-settings-inline-action" onClick={() => saveSimpleField("userCountry", detailFieldValue || "India", "Country updated.")}>
                    Save country
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "edit_languages" ? (
                <div className="ws-settings-form">
                  <input
                    value={detailFieldValue}
                    onChange={(e) => {
                      setDetailFieldValue(e.target.value);
                      setDetailNotice("");
                    }}
                    placeholder="Languages (comma separated)"
                  />
                  <button type="button" className="ws-settings-inline-action" onClick={() => saveSimpleField("userLanguages", detailFieldValue, "Languages updated.")}>
                    Save languages
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "edit_gender" ? (
                <div className="ws-settings-form">
                  <select
                    value={detailFieldValue || "Not set"}
                    onChange={(e) => {
                      setDetailFieldValue(e.target.value);
                      setDetailNotice("");
                    }}
                    aria-label="Select gender"
                  >
                    {GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="ws-settings-inline-action" onClick={() => saveSimpleField("userGender", detailFieldValue || "Not set", "Gender updated.")}>
                    Save gender
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "edit_birth_date" ? (
                <div className="ws-settings-form">
                  <input type="date" value={detailDateValue} onChange={(e) => setDetailDateValue(e.target.value)} />
                  <button type="button" className="ws-settings-inline-action" onClick={onSaveBirthDate}>
                    Save birth date
                  </button>
                </div>
              ) : null}
              {activeDetail.feature === "view_age" ? (
                <div className="ws-settings-info-chip">Current age: {localStorage.getItem("age") || "Not set"}</div>
              ) : null}
              {activeDetail.feature === "sessions" ? (
                <div className="ws-settings-list-card">
                  {deviceSessions.map((session) => (
                    <div key={session.id} className="ws-settings-list-row">
                      <div>
                        <strong>{session.device}</strong>
                        <span>{session.lastSeen}{session.current ? " (current)" : ""}</span>
                      </div>
                      {!session.current ? (
                        <button type="button" onClick={() => setDeviceSessions((prev) => prev.filter((x) => x.id !== session.id))}>
                          Log out
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {activeDetail.feature === "logout_others" ? (
                <button type="button" className="ws-settings-inline-action" onClick={onLogoutOtherSessions}>
                  Log out all other sessions
                </button>
              ) : null}
              {activeDetail.feature === "muted_accounts" ? (
                <div className="ws-settings-form">
                  <div className="ws-settings-list-card">
                    {mutedAccounts.length ? mutedAccounts.map((handle) => (
                      <div key={handle} className="ws-settings-list-row">
                        <strong>{handle}</strong>
                        <button type="button" onClick={() => removeRelationHandle("muted", handle)}>Remove</button>
                      </div>
                    )) : <span>No muted accounts.</span>}
                  </div>
                  <input value={relationInput} onChange={(e) => setRelationInput(e.target.value)} placeholder="@handle" />
                  <button type="button" className="ws-settings-inline-action" onClick={() => addRelationHandle("muted")}>Add muted account</button>
                </div>
              ) : null}
              {activeDetail.feature === "blocked_accounts" ? (
                <div className="ws-settings-form">
                  <div className="ws-settings-list-card">
                    {blockedAccounts.length ? blockedAccounts.map((handle) => (
                      <div key={handle} className="ws-settings-list-row">
                        <strong>{handle}</strong>
                        <button type="button" onClick={() => removeRelationHandle("blocked", handle)}>Remove</button>
                      </div>
                    )) : <span>No blocked accounts.</span>}
                  </div>
                  <input value={relationInput} onChange={(e) => setRelationInput(e.target.value)} placeholder="@handle" />
                  <button type="button" className="ws-settings-inline-action" onClick={() => addRelationHandle("blocked")}>Add blocked account</button>
                </div>
              ) : null}
              {activeDetail.feature === "restricted_accounts" ? (
                <div className="ws-settings-form">
                  <div className="ws-settings-list-card">
                    {restrictedAccounts.length ? restrictedAccounts.map((handle) => (
                      <div key={handle} className="ws-settings-list-row">
                        <strong>{handle}</strong>
                        <button type="button" onClick={() => removeRelationHandle("restricted", handle)}>Remove</button>
                      </div>
                    )) : <span>No restricted accounts.</span>}
                  </div>
                  <input value={relationInput} onChange={(e) => setRelationInput(e.target.value)} placeholder="@handle" />
                  <button type="button" className="ws-settings-inline-action" onClick={() => addRelationHandle("restricted")}>Add restricted account</button>
                </div>
              ) : null}
              {detailNotice ? (
                <p className={`ws-state-msg ${detailNoticeType === "error" ? "ws-state-error" : "ws-state-success"}`}>
                  {detailNotice}
                </p>
              ) : null}
              {activeDetail.danger ? (
                <button type="button" className="ws-settings-danger-btn" onClick={onDeactivateAccount}>
                  Deactivate
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="ws-settings-details">
            {rightPanel.items.map((item) => {
              const DetailIcon = item.Icon || UserRound;
              if (item.kind === "account") {
                const accountRowClass = `ws-settings-detail-item ws-settings-account-row${item.dividerTop ? " divider-top" : ""}`;
                if (!item.action) {
                  return (
                    <article key={item.title} className={accountRowClass}>
                      <div className="ws-settings-detail-copy">
                        <strong>{item.title}</strong>
                        <p>{item.subtitle}</p>
                        {item.secondary ? <p className="ws-settings-subcopy">{item.secondary}</p> : null}
                      </div>
                    </article>
                  );
                }
                return (
                  <button
                    key={item.title}
                    type="button"
                    className={`${accountRowClass} ws-settings-detail-link`}
                    onClick={() => onDetailAction(item)}
                  >
                    <div className="ws-settings-detail-copy">
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                      {item.secondary ? <p className="ws-settings-subcopy">{item.secondary}</p> : null}
                    </div>
                    {item.chevron ? <ChevronRight size={20} /> : null}
                  </button>
                );
              }
              if (item.kind === "theme-mode") {
                return (
                  <article key={item.title} className="ws-settings-detail-item ws-settings-theme-row">
                    <span className="ws-settings-detail-icon">
                      <DetailIcon size={18} />
                    </span>
                    <div className="ws-settings-detail-copy">
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                      <div className="ws-theme-mode-group" role="group" aria-label="Select theme mode">
                        <button
                          type="button"
                          className={`ws-theme-mode-btn ${themePref === "dark" ? "active" : ""}`}
                          onClick={() => applyThemePreference("dark")}
                        >
                          Dark
                        </button>
                        <button
                          type="button"
                          className={`ws-theme-mode-btn ${themePref === "light" ? "active" : ""}`}
                          onClick={() => applyThemePreference("light")}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          className={`ws-theme-mode-btn ${themePref === "device" ? "active" : ""}`}
                          onClick={() => applyThemePreference("device")}
                        >
                          Device
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }

              if (item.kind === "redirect" || item.kind === "link" || item.kind === "action") {
                return (
                  <button
                    key={item.title}
                    type="button"
                    className="ws-settings-detail-item ws-settings-detail-link"
                    onClick={() => onDetailAction(item)}
                  >
                    <span className="ws-settings-detail-icon">
                      <DetailIcon size={18} />
                    </span>
                    <div className="ws-settings-detail-copy">
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                    </div>
                    {item.kind === "redirect" ? <ArrowUpRight size={18} /> : <ChevronRight size={20} />}
                  </button>
                );
              }

              return (
                <article key={item.title} className={`ws-settings-detail-item ${item.kind === "toggle" ? "is-toggle" : ""}`}>
                  <span className="ws-settings-detail-icon">
                    <DetailIcon size={18} />
                  </span>
                  <div className="ws-settings-detail-copy">
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                  </div>
                  {item.kind === "toggle" ? (
                    <button
                      type="button"
                      className={`ws-settings-toggle ${prefs[item.key] ? "active" : ""}`}
                      aria-label={`Toggle ${item.title}`}
                      onClick={() => togglePref(item.key)}
                    >
                      <span />
                    </button>
                  ) : item.kind === "info" ? null : (
                    <ChevronRight size={20} />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default SettingsSection;
