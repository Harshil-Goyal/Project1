import { useState } from "react";
import { Link } from "react-router-dom";
import "../Helpcenter/Helpcenter.css";
import "./PolicyPageLayout.css";
import navbarLogo from "../../Dmgsnoname.png";
import { submitBugReport } from "../utils/bugApi";

function sectionId(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanNumbering(label) {
  return label.replace(/^\d+\.\s*/, "");
}

function PolicyPageLayout({ title, navbarTitle, subtitle, intro = [], sections }) {
  const [tocOpen, setTocOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportNotice, setReportNotice] = useState({ open: false, title: "", message: "" });
  const [reportForm, setReportForm] = useState({
    email: "",
    title: "",
    details: "",
  });

  const onReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const onReportSubmit = async (event) => {
    event.preventDefault();
    const email = reportForm.email.trim();
    const bugTitle = reportForm.title.trim();
    const details = reportForm.details.trim();

    if (!email || !bugTitle || !details) {
      setReportNotice({ open: true, title: "Submission failed", message: "Fill the required fields" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setReportNotice({ open: true, title: "Submission failed", message: "Incorrect credential" });
      return;
    }

    try {
      setReportSubmitting(true);
      await submitBugReport({ email, title: bugTitle, details });
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

  return (
    <div className="sp-page pp-page">
      <header className="sp-header">
        <div className="sp-brand">
          <img className="sp-logo" src={navbarLogo} alt="Gupshup logo" />
          <h1>{navbarTitle || title}</h1>
        </div>
      </header>

      <div className={`pp-mobile-toc${tocOpen ? " open" : ""}`}>
        <button
          type="button"
          className="pp-mobile-toc-toggle"
          aria-expanded={tocOpen}
          aria-controls="pp-mobile-toc-list"
          aria-label="Open sections menu"
          onClick={() => setTocOpen((prev) => !prev)}
        >
          &#8942;
        </button>
        <div id="pp-mobile-toc-list" className="pp-mobile-toc-panel">
          <ol>
            {sections.map((section) => (
              <li key={section.heading}>
                <a
                  href={`#${sectionId(section.heading)}-heading`}
                  onClick={() => setTocOpen(false)}
                >
                  {cleanNumbering(section.heading)}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <main className="pp-wrap">
        <section className="pp-intro">
          <h2>{title}</h2>
          {subtitle ? <h3>{subtitle}</h3> : null}
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>

        <section className="pp-content">
          <aside className="pp-toc">
            <ol>
              {sections.map((section) => (
                <li key={section.heading}>
                  <a href={`#${sectionId(section.heading)}-heading`}>{cleanNumbering(section.heading)}</a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="pp-article">
            {sections.map((section, sectionIndex) => (
              <section key={section.heading} className="pp-main-section">
                <h3 id={`${sectionId(section.heading)}-heading`}>
                  {`${sectionIndex + 1}. ${cleanNumbering(section.heading)}`}
                </h3>
                {section.intro ? <p>{section.intro}</p> : null}
                {section.text ? <p>{section.text}</p> : null}
                {section.points ? (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {section.subsections?.map((sub, subIndex) => (
                  <div key={sub.title} className="pp-subsection">
                    <h4>{`${subIndex + 1}. ${cleanNumbering(sub.title)}`}</h4>
                    {sub.intro ? <p>{sub.intro}</p> : null}
                    {sub.text ? <p>{sub.text}</p> : null}
                    {sub.points ? (
                      <ul>
                        {sub.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </section>
            ))}
          </article>
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
            <label htmlFor="policy-report-email">Email</label>
            <input
              id="policy-report-email"
              name="email"
              type="email"
              value={reportForm.email}
              onChange={onReportChange}
              placeholder="you@example.com"
              className="sp-report-input"
            />

            <label htmlFor="policy-report-title">Issue title</label>
            <input
              id="policy-report-title"
              name="title"
              type="text"
              value={reportForm.title}
              onChange={onReportChange}
              placeholder="Short summary"
              className="sp-report-input"
            />

            <label htmlFor="policy-report-details">Details</label>
            <textarea
              id="policy-report-details"
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

export default PolicyPageLayout;
