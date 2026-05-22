import { useMemo, useState } from "react";
import { SectionState } from "../WebsiteUI";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { fetchNotifications } from "../services/websiteApi";

function NotificationsSection({ externalNotifications = null }) {
  const [activeTab, setActiveTab] = useState("all");
  const { data: notifications, isLoading, error } = useAsyncResource(fetchNotifications, []);
  const notificationItems = externalNotifications?.length ? externalNotifications : notifications;
  const visibleNotifications = useMemo(() => {
    if (activeTab === "mentions") {
      return notificationItems.filter((notification) => notification.type === "mention");
    }
    return notificationItems;
  }, [activeTab, notificationItems]);

  return (
    <section className="ws-panel ws-x-section ws-notifications-section">
      <header className="ws-header-row">
        <h1 className="ws-page-title">Notifications</h1>
      </header>

      <div className="ws-tabbar">
        <button type="button" className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
          <span className="ws-tab-label">All</span>
        </button>
        <button
          type="button"
          className={activeTab === "mentions" ? "active" : ""}
          onClick={() => setActiveTab("mentions")}
        >
          <span className="ws-tab-label">Mentions</span>
        </button>
      </div>

      <SectionState
        isLoading={isLoading}
        error={error}
        isEmpty={!visibleNotifications.length}
        emptyText={activeTab === "mentions" ? "No mentions yet." : "No notifications yet."}
      />

      <div className="ws-feed">
        {visibleNotifications.map((notification) => (
          <article key={notification.id} className="ws-feed-row ws-notif-row">
            <p>{notification.message}</p>
            <span>{notification.time}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default NotificationsSection;
