export function SectionState({ isLoading, error, isEmpty, emptyText = "No data available." }) {
  if (isLoading) return <p className="ws-state-msg">Loading...</p>;
  if (error) return <p className="ws-state-msg ws-state-error">{error}</p>;
  if (isEmpty) return <p className="ws-state-msg">{emptyText}</p>;
  return null;
}
