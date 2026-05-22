import { useEffect, useMemo, useState } from "react";
import { SectionState } from "../WebsiteUI";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { fetchRightPanelNews, fetchTrendItems, fetchTrendingPosts } from "../services/websiteApi";
import { searchUsers } from "../services/socialApi";
import { useSearchParams } from "react-router-dom";

function ExploreSection({ onToggleFollowHandle, followedHandles = [] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const tabFromUrl = searchParams.get("exploreTab");
  const activeTab = ["users", "trending", "news"].includes(tabFromUrl) ? tabFromUrl : "users";
  const { data: trends, isLoading, error } = useAsyncResource(fetchTrendItems, []);
  const { data: newsItems, isLoading: newsLoading, error: newsError } = useAsyncResource(fetchRightPanelNews, []);
  const { data: trendingPosts, isLoading: trendingLoading, error: trendingError } = useAsyncResource(fetchTrendingPosts, []);
  
  // Local state for searched users to avoid complicated async resource for search
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (!query || activeTab !== "users") {
      setSearchedUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const results = await searchUsers(query);
        setSearchedUsers(results);
      } catch { /* ignore */ }
      setUsersLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const tabs = [
    { id: "users", label: "Users" },
    { id: "trending", label: "Trending" },
    { id: "news", label: "News" },
  ];

  const contentItems = useMemo(() => {
    const trendingItems = (trends || []).map((trend) => ({
      id: `trend-${trend?.id || Math.random()}`,
      kind: "trend",
      title: trend?.topic || "Trending Topic",
      subtitle: trend?.posts || "0 posts",
      badge: "Topic",
    }));
    const headlineItems = newsItems.map((headline, index) => ({
      id: `news-${index + 1}`,
      kind: "news",
      title: headline,
      subtitle: "Latest update",
      badge: "News",
    }));
    const postItems = (trendingPosts || []).map((post) => ({
      id: `post-${post?.id || Math.random()}`,
      kind: "post",
      title: (post?.text || "Post Content").slice(0, 50) + ((post?.text || "").length > 50 ? "..." : ""),
      subtitle: `By ${post?.author || "User"} • ${post?.stats?.likes || 0} likes`,
      badge: "Trending Post",
      post,
    }));
    const userItems = (searchedUsers || []).map((user) => ({
      id: `user-${user?.id || Math.random()}`,
      kind: "user",
      title: user?.name || "GupShup User",
      subtitle: user?.handle || "@user",
      badge: "Account",
      user,
    }));

    if (activeTab === "trending") return postItems;
    if (activeTab === "news") return headlineItems;
    if (activeTab === "users") return userItems;
    return userItems;
  }, [activeTab, trends, newsItems, trendingPosts, searchedUsers]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return contentItems;
    return contentItems.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
  }, [contentItems, query]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };
  const handleTabChange = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set("exploreTab", tabId);
    setSearchParams(next, { replace: true });
  };
  const hasError = error || newsError;
  const isLoadingState = isLoading || newsLoading;

  return (
    <section className="ws-panel ws-x-section ws-explore-section">
      <header className="ws-header-row">
        <h1 className="ws-page-title">Explore</h1>
      </header>

      <div className="ws-searchbar">
        <input
          className="ws-search-input"
          type="search"
          placeholder="Search"
          aria-label="Search explore"
          value={query}
          onChange={handleSearchChange}
        />
      </div>
      <div className="ws-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="ws-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <SectionState
        isLoading={isLoadingState}
        error={hasError}
        isEmpty={!filteredItems.length}
        emptyText={query.trim() ? "No matching results found." : "No explore items available."}
      />

      <div className="ws-feed">
        {filteredItems.map((item) => (
          <article key={item.id} className="ws-feed-row ws-explore-row">
            <div className="ws-explore-copy">
              <small>{item.badge}</small>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </div>
            {item.kind === "user" && (
              <button
                type="button"
                className={`ws-follow-btn ${followedHandles.includes(item.user.handle) ? "following" : ""}`}
                onClick={() => onToggleFollowHandle?.(item.user.handle)}
              >
                {followedHandles.includes(item.user.handle) ? "Following" : "Follow"}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ExploreSection;
