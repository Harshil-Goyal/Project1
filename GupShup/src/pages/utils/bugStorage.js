const BUG_REPORTS_KEY = "gs_bug_reports";

function readReports() {
  try {
    const raw = localStorage.getItem(BUG_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read bug reports from storage", error);
    return [];
  }
}

function writeReports(reports) {
  localStorage.setItem(BUG_REPORTS_KEY, JSON.stringify(reports));
}

export function loadBugReports() {
  return readReports();
}

export function addBugReport({ email, title, details }) {
  const reports = readReports();
  const now = new Date().toISOString();
  const newReport = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    title,
    details,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  const next = [newReport, ...reports];
  writeReports(next);
  return newReport;
}

export function resolveBugReport(id) {
  const reports = readReports();
  const now = new Date().toISOString();
  const next = reports.map((report) =>
    report.id === id ? { ...report, status: "resolved", updatedAt: now } : report
  );
  writeReports(next);
  return next;
}

export function deleteBugReport(id) {
  const reports = readReports();
  const next = reports.filter((report) => report.id !== id);
  writeReports(next);
  return next;
}
