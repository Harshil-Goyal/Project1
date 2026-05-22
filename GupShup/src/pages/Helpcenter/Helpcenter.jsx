import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Helpcenter.css";
import darkModeLogo from "../../darkModeLogoGupShup.png";
import navbarLogo from "../../Dmgsnoname.png";
import { submitBugReport } from "../utils/bugApi";

const faqItems = [
  {
    id: "faq-reset-password",
    title: "FAQ: How do I reset my password?",
    answer: "Go to Sign In, click Forgot password, and follow the reset link sent to your registered email address.",
    keywords: "reset password forgot password sign in email",
  },
  {
    id: "faq-block-report",
    title: "FAQ: How can I block or report someone?",
    answer: "Open the user profile in chat, choose Block or Report, and include details so we can investigate faster.",
    keywords: "block report user abuse safety",
  },
  {
    id: "faq-delayed-messages",
    title: "FAQ: Why are messages delayed?",
    answer: "This usually happens on unstable networks. Reconnect to a stronger connection or restart the app to re-sync your session.",
    keywords: "delayed messages network reconnect session sync",
  },
  {
    id: "faq-delete-account",
    title: "FAQ: Can I delete my account permanently?",
    answer: "Yes. Go to account settings, select Delete account, and confirm. This action cannot be undone.",
    keywords: "delete account permanently remove account settings",
  },
  {
    id: "faq-legal-policies",
    title: "FAQ: Where do I find legal policies?",
    answer: "Use the footer links to open the Terms of Service and Privacy Policy pages.",
    keywords: "legal policies terms privacy policy links",
  },
  {
    id: "faq-change-email",
    title: "FAQ: Can I change my registered email?",
    answer:
      "Yes. Open account settings and update your email address. For security, you may be asked to verify your old and new email before changes are applied.",
    keywords: "change email account settings verify email",
  },
  {
    id: "faq-two-factor",
    title: "FAQ: Does GS support two-factor authentication?",
    answer:
      "GS supports additional sign-in verification for eligible accounts. Go to security settings to enable it and save your recovery options.",
    keywords: "two factor authentication 2fa security verification",
  },
  {
    id: "faq-media-sharing",
    title: "FAQ: Which files can I share in chat?",
    answer:
      "You can share common image, document, and short video files. If upload fails, reduce file size, check connection quality, and try again.",
    keywords: "media sharing files upload image video document",
  },
  {
    id: "faq-notifications",
    title: "FAQ: Why am I not receiving notifications?",
    answer:
      "Check in-app notification settings, device notification permissions, and battery optimization restrictions. Re-login if tokens are expired.",
    keywords: "notifications not receiving push permission battery",
  },
  {
    id: "faq-account-locked",
    title: "FAQ: What if my account gets locked?",
    answer:
      "Temporary locks can happen after repeated failed sign-ins or unusual activity. Wait a few minutes and try again, or contact support with your account email.",
    keywords: "account locked failed login unusual activity support",
  },
  {
    id: "faq-message-history",
    title: "FAQ: How long is chat history stored?",
    answer:
      "Message retention can vary based on account type, legal obligations, and safety checks. Refer to Privacy Policy for current retention details.",
    keywords: "message history storage retention privacy policy",
  },
];

const featureItems = [
  {
    id: "feature-real-time-chat",
    title: "Real-time chat",
    tag: "Messaging",
    summary: "Live one-to-one and group messaging with instant delivery and read receipts.",
    detail:
      "GS real time chat keeps every conversation synchronized instantly across devices. You can create private chats, group rooms, share files, and see typing and read status in seconds. Smart notifications ensure you do not miss important updates while reducing noise from low-priority threads.",
    keywords: "real time chat instant messages group chat",
  },
  {
    id: "feature-audio-video-calling",
    title: "Audio-video calling",
    tag: "Calling",
    summary: "Switch between voice and video calls with stable quality and low delay.",
    detail:
      "GS supports smooth audio and video calling for both personal and team conversations. Start voice calls, upgrade to video in one click, or join quick group calls when collaboration is urgent. Adaptive quality helps calls remain stable even when network conditions fluctuate.",
    keywords: "audio video calling voice call group call",
  },
  {
    id: "feature-end-to-end-encryption",
    title: "End-to-end encryption",
    tag: "Security",
    summary: "Private conversations are protected so only participants can access messages.",
    detail:
      "Sensitive conversations on GS are secured with end-to-end encryption to protect your message privacy. Encryption keys are managed so that chat content remains unreadable to third parties in transit. Combined with account safety controls, this helps keep personal and business communication protected.",
    keywords: "end to end encryption security privacy",
  },
  {
    id: "feature-microblogging",
    title: "Microblogging",
    tag: "Social",
    summary: "Post short updates, media, and thoughts that followers can react to quickly.",
    detail:
      "GS microblogging lets you publish concise posts, images, and links to share ideas in real time. Followers can comment, repost, and react, helping conversations spread naturally. This gives you a lightweight way to broadcast announcements and community updates without leaving the platform.",
    keywords: "microblogging posts feed social",
  },
  {
    id: "feature-chat-support",
    title: "Chat support",
    tag: "Support",
    summary: "Get quick support through in-app conversations whenever issues appear.",
    detail:
      "When you need help, GS chat support provides direct in-app assistance for account, billing, and technical issues. Support flows are designed for quick triage so your issue reaches the right team faster. You can share screenshots and context directly in the thread for more accurate resolution.",
    keywords: "chat support help center support team",
  },
  {
    id: "feature-whats-trending",
    title: "What's trending",
    tag: "Discover",
    summary: "Track popular topics and fast-rising conversations across the community.",
    detail:
      "The trending panel highlights high-activity topics so you can follow what people are discussing right now. It updates continuously with fresh signals from across public conversations. This helps creators, teams, and users discover relevant discussions and respond at the right time.",
    keywords: "whats trending trends discover topics",
  },
];

function HelpCenter() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportNotice, setReportNotice] = useState({ open: false, title: "", message: "" });
  const [reportForm, setReportForm] = useState({
    email: "",
    title: "",
    details: "",
  });
  const headerMenuRef = useRef(null);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const searchIndex = useMemo(() => {
    const base = [
      { id: "community-guidelines", title: "Community Guidelines", keywords: "community guidelines rules safety respect" },
      ...faqItems.map((item) => ({ id: item.id, title: item.title, keywords: item.keywords })),
      ...featureItems.map((item) => ({ id: item.id, title: item.title, keywords: item.keywords })),
    ];
    return base;
  }, []);

  const suggestions = [
    "Community Guidelines",
    ...faqItems.map((item) => item.title),
    ...featureItems.map((item) => item.title),
  ];

  const filteredSuggestions = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return [];
    return suggestions.filter((item) => normalizeSearchText(item).includes(q));
  }, [query, suggestions]);

  const runSearch = (rawQuery = query) => {
    const q = normalizeSearchText(rawQuery);
    if (!q) return;

    const ranked = searchIndex
      .map((item) => {
        const text = normalizeSearchText(`${item.title} ${item.keywords}`);
        if (!text.includes(q)) return null;

        let score = 0;
        const normalizedTitle = normalizeSearchText(item.title);
        if (normalizedTitle === q) score += 3;
        else if (normalizedTitle.startsWith(q)) score += 2;
        else score += 1;

        return { item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const match = ranked[0]?.item;
    if (!match) return;

    const element = document.getElementById(match.id);
    if (!element) return;

    if (element.tagName === "DETAILS") {
      element.open = true;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);
  };

  const handleSearchSubmit = (event) => {
    if (event.key === "Escape") {
      setIsSearchFocused(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!filteredSuggestions.length) return;
      setActiveSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!filteredSuggestions.length) return;
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
      return;
    }

    if (event.key !== "Enter") return;
    if (activeSuggestionIndex >= 0 && filteredSuggestions[activeSuggestionIndex]) {
      const chosen = filteredSuggestions[activeSuggestionIndex];
      setQuery(chosen);
      setIsSearchFocused(false);
      runSearch(chosen);
      return;
    }
    runSearch();
  };

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("report") === "1") {
      setShowReportModal(true);
    }
  }, [location.search]);

  const onReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const onReportSubmit = async (event) => {
    event.preventDefault();
    const email = reportForm.email.trim();
    const title = reportForm.title.trim();
    const details = reportForm.details.trim();

    if (!email || !title || !details) {
      setReportNotice({ open: true, title: "Submission failed", message: "Fill the required fields" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setReportNotice({ open: true, title: "Submission failed", message: "Incorrect credential" });
      return;
    }

    try {
      setReportSubmitting(true);
      await submitBugReport({ email, title, details });
      setReportNotice({ open: true, title: "Submitted successfully", message: "Submitted successfully" });
      setReportForm({ email: "", title: "", details: "" });
    } catch (error) {
      console.error(error);
      setReportNotice({ open: true, title: "Submission failed", message: "Error submitting report" });
    } finally {
      setReportSubmitting(false);
    }
  };

  const closeReportModal = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShowReportModal(false);
  };

  const closeReportNotice = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setReportNotice({ open: false, title: "", message: "" });
  };

  const openSearchFromHeader = () => {
    setHeaderMenuOpen(false);
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchInputRef.current?.focus();
    setIsSearchFocused(true);
  };

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-brand">
          <img className="sp-logo" src={navbarLogo} alt="Gupshup logo" />
          <h1>Help Center</h1>
        </div>
        <div className={`sp-header-menu${headerMenuOpen ? " open" : ""}`} ref={headerMenuRef}>
          <button
            type="button"
            className="sp-header-menu-toggle"
            aria-label="Open help menu"
            aria-expanded={headerMenuOpen}
            aria-controls="sp-header-menu-panel"
            onClick={() => setHeaderMenuOpen((prev) => !prev)}
          >
            &#8942;
          </button>
          <div id="sp-header-menu-panel" className="sp-header-menu-panel">
            <button type="button" className="sp-header-menu-item" onClick={openSearchFromHeader}>
              Search
            </button>
            <button
              type="button"
              className="sp-header-menu-item"
              onClick={() => {
                setHeaderMenuOpen(false);
                setShowReportModal(true);
              }}
            >
              Report a bug
            </button>
          </div>
        </div>
      </header>

      <section className="sp-hero">
        <div className="sp-hero-left">
          <p className="sp-hero-kicker">Welcome to GS Help Center</p>
          <h2>
            What can
            <br />
            we help you
            <br />
            find ?
          </h2>
          <div className="sp-hero-search" ref={searchWrapRef}>
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search"
              aria-label="Search all help articles"
            />
            <button type="button" className="sp-hero-search-btn" onClick={() => runSearch()} aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" fill="none" />
                <line x1="16" y1="16" x2="21" y2="21" />
              </svg>
            </button>
            {isSearchFocused && filteredSuggestions.length > 0 ? (
              <div className="sp-search-suggestions" role="listbox" aria-label="Search suggestions">
                {filteredSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`sp-search-suggestion-item${
                      activeSuggestionIndex >= 0 && filteredSuggestions[activeSuggestionIndex] === item
                        ? " active"
                        : ""
                    }`}
                    onMouseDown={() => {
                      setQuery(item);
                      setIsSearchFocused(false);
                      setActiveSuggestionIndex(-1);
                    }}
                    onClick={() => runSearch(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <img className="sp-hero-mark" src={darkModeLogo} alt="Gupshup" />
      </section>

      <main>
        <section className="sp-panel-grid">
          <article id="community-guidelines" className="sp-panel">
            <h3>Community Guidelines</h3>
            <span className="sp-chip">Community Guidelines</span>
            {featureItems.map((f) => (
              <span className="sp-chip" key={f.id}>{f.title}</span>
            ))}
            <p>
              Our community is built for safe and meaningful real-time conversation. Keep discussions respectful, avoid personal attacks, and do not post threatening, hateful, or harassing content.
            </p>
            <p>
              Do not share private information such as phone numbers, OTP codes, addresses, passwords, or financial details. If someone pressures you for this data, stop chatting and report the account.
            </p>
            <p>
              Any attempt to distribute malware, run scams, impersonate another user, or bypass account security may result in immediate account suspension.
            </p>
            <p>
              Report harmful behavior using in-app reporting tools or through the Report a bug option in the menu. Our moderation team reviews reports and can remove content or restrict accounts.
            </p>
            <p>
              Be mindful of consent and boundaries in conversations. Do not repeatedly message people who ask you to stop, and avoid sharing private screenshots or recordings without permission.
            </p>
            <p>
              Use clear and respectful language in group spaces. Off-topic spam, repeated promotions, and misleading links reduce trust and may lead to temporary posting limits.
            </p>
            <p>
              If your account appears compromised, reset your password immediately and review recent sessions. Reporting suspicious activity early helps us keep the community safer for everyone.
            </p>
          </article>

          <article className="sp-panel">
            <h3>FAQs</h3>
            {faqItems.map((item, index) => (
              <details key={item.id} id={item.id} open={index === 0}>
                <summary>{item.title.replace("FAQ: ", "")}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </article>
        </section>

        <section className="sp-content-wrap sp-top-tight">
          <h3 className="sp-section-title">What's on GS</h3>
          <div className="sp-feature-grid">
            {featureItems.map((item) => (
              <article className="sp-feature-card" id={item.id} key={item.id}>
                <div className="sp-feature-media">
                  <img src={darkModeLogo} alt="Gupshup" />
                </div>
                <div className="sp-feature-body">
                  <span className="sp-chip">{item.tag}</span>
                  <h4 className="sp-feature-title">{item.title}</h4>
                  <p className="sp-feature-summary">{item.summary}</p>
                  <button className="sp-feature-btn" type="button" onClick={() => setSelectedFeature(item)}>
                    Read more
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="sp-footer">
        <div className="sp-footer-links">
          <span>&copy; 2026 GupShup</span>
          <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>
          <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
          <Link to="/help-center" target="_blank" rel="noopener noreferrer">Help Center</Link>
          <button type="button" className="sp-footer-link-btn" onClick={() => setShowReportModal(true)}>
            Report a bug
          </button>
          <a href="mailto:support@yourchatapp.com">Contact</a>
        </div>
      </footer>

      <div className={`sp-modal${selectedFeature ? " open" : ""}`} aria-hidden={!selectedFeature}>
        <div className="sp-modal-card" role="dialog" aria-modal="true">
          <h4 className="sp-modal-title">{selectedFeature?.title || "Feature"}</h4>
          <p className="sp-modal-copy">{selectedFeature?.detail || ""}</p>
          <button className="sp-btn-dark sp-mt-16" type="button" onClick={() => setSelectedFeature(null)}>
            Close
          </button>
        </div>
      </div>

      <div
        className={`sp-modal sp-report-overlay${showReportModal ? " open" : ""}`}
        aria-hidden={!showReportModal}
        onClick={(e) => e.target === e.currentTarget && closeReportModal()}
      >
        <div className="sp-modal-card sp-report-modal-card" role="dialog" aria-modal="true">
          <button
            type="button"
            className="sp-report-close"
            aria-label="Close report form"
            onClick={closeReportModal}
          >
            &times;
          </button>
          <h4 className="sp-modal-title">Report a Bug</h4>
          <p className="sp-modal-copy">
            Share what happened, how to reproduce it, and which device/browser you are using.
          </p>

          <form onSubmit={onReportSubmit}>
            <label htmlFor="report-email">Email</label>
            <input
              id="report-email"
              name="email"
              type="email"
              value={reportForm.email}
              onChange={onReportChange}
              placeholder="you@example.com"
              className="sp-report-input"
            />

            <label htmlFor="report-title">Issue title</label>
            <input
              id="report-title"
              name="title"
              type="text"
              value={reportForm.title}
              onChange={onReportChange}
              placeholder="Short summary"
              className="sp-report-input"
            />

            <label htmlFor="report-details">Details</label>
            <textarea
              id="report-details"
              name="details"
              value={reportForm.details}
              onChange={onReportChange}
              placeholder="Steps to reproduce, expected result, actual result"
              className="sp-report-textarea"
            />

            <div className="sp-report-actions">
              <button className="sp-btn-dark" type="submit" disabled={reportSubmitting}>
                {reportSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`sp-modal${reportNotice.open ? " open" : ""}`}
        aria-hidden={!reportNotice.open}
        onClick={(e) => e.target === e.currentTarget && closeReportNotice()}
      >
        <div className="sp-modal-card" role="dialog" aria-modal="true">
          <h4 className="sp-modal-title">{reportNotice.title}</h4>
          <p className="sp-modal-copy">{reportNotice.message}</p>
          <button
            className="sp-btn-dark sp-mt-16"
            type="button"
            onClick={closeReportNotice}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpCenter;
