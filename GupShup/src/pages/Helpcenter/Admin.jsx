import { useEffect, useMemo, useState } from "react";
import "./Helpcenter.css";
import { deleteBugReportById, fetchBugReports, resolveBugReportById } from "../utils/bugApi";
import navbarLogo from "../../Dmgsnoname.png";
import { useAsyncResource } from "../Website/hooks/useAsyncResource";

function formatTime(value) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString();
}

function Admin() {
  const { data, isLoading, error } = useAsyncResource(fetchBugReports, []);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setReports(data);
  }, [data]);

  const pending = useMemo(() => reports.filter((r) => r.status !== "resolved"), [reports]);
  const resolved = useMemo(() => reports.filter((r) => r.status === "resolved"), [reports]);
  const selected = pending.find((item) => item.id === selectedId);

  const markResolved = async (id) => {
    try {
      const updated = await resolveBugReportById(id);
      setReports((prev) => prev.map((report) => (report.id === id ? updated : report)));
      setSelectedId(null);
    } catch (requestError) {
      window.alert(requestError.message || "Unable to resolve bug report");
    }
  };

  const removeResolved = async (id) => {
    try {
      await deleteBugReportById(id);
      setReports((prev) => prev.filter((report) => report.id !== id));
    } catch (requestError) {
      window.alert(requestError.message || "Unable to delete bug report");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    window.location.href = "/";
  };

  return (
    <div className="sp-page sp-admin-page">
      <header className="sp-header">
        <div className="sp-brand">
          <img className="sp-logo" src={navbarLogo} alt="Gupshup logo" />
          <h1>Admin Panel</h1>
        </div>
        <button className="sp-admin-logout" onClick={handleLogout} aria-label="Logout" title="Logout">
          Logout
        </button>
      </header>

      <main className="sp-admin-layout">
        <section className="sp-admin-panel">
          <div className="sp-admin-head"><h2 className="sp-admin-head-title">Reported Bugs</h2></div>
          <div className="sp-admin-body">
            {isLoading ? <p className="sp-admin-empty">Loading bug reports...</p> : null}
            {error ? <p className="sp-admin-empty">{error}</p> : null}
            {pending.length ? pending.map((report) => (
              <button key={report.id} type="button" className={`sp-bug-item${selectedId === report.id ? " active" : ""}`} onClick={() => setSelectedId(report.id)}>
                <span className="sp-admin-item-title">{report.title}</span>
                <span className="sp-admin-item-meta">{report.email} | {formatTime(report.createdAt)}</span>
              </button>
            )) : <p className="sp-admin-empty">No pending bug reports.</p>}
          </div>
        </section>

        <section className="sp-admin-panel">
          <div className="sp-admin-head"><h2 className="sp-admin-head-title">Issue Details</h2></div>
          <div className="sp-detail-area">
            {selected ? (
              <>
                <h3 className="sp-admin-detail-title">{selected.title}</h3>
                <p className="sp-admin-detail-meta">
                  Reported by {selected.email} | {formatTime(selected.createdAt)}
                </p>
                <p className="sp-admin-detail-copy">{selected.details}</p>
                <button className="sp-btn-dark sp-admin-resolve-btn" type="button" onClick={() => markResolved(selected.id)}>
                  Mark as resolved
                </button>
              </>
            ) : (
              <p className="sp-admin-empty">Click a reported bug from the left panel to view full details here.</p>
            )}
          </div>
          <div className="sp-resolved-area">
            <h4 className="sp-admin-resolved-title">Resolved Issues</h4>
            <ul className="sp-resolved-list">
              {resolved.map((item) => (
                <li key={item.id}>
                  <span className="sp-admin-resolved-text">{item.title} | {formatTime(item.updatedAt || item.createdAt)}</span>
                  <button className="sp-btn-danger" type="button" onClick={() => removeResolved(item.id)}>Delete</button>
                </li>
              ))}
            </ul>
            {!resolved.length ? <p className="sp-admin-empty sp-admin-empty-top">No issues resolved yet.</p> : null}
          </div>
        </section>
      </main>

      <footer className="sp-footer sp-admin-footer">&copy; 2026 GS Admin</footer>
    </div>
  );
}

export default Admin;
