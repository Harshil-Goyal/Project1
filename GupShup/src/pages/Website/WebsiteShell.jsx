import { useEffect, useMemo, useState, useRef } from "react";
import { Bell, Bookmark, Ellipsis, House, Mail, Search, Settings as SettingsIcon, User } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { NAV_ITEMS } from "./constants";
import logoNoNameLight from "../../Dmgsnoname.png";
import logoNoNameDark from "../../Lmgsnoname.png";
import HomeSection from "./sections/HomeSection";
import ExploreSection from "./sections/ExploreSection";
import NotificationsSection from "./sections/NotificationsSection";
import BookmarksSection from "./sections/BookmarksSection";
import ChatSection from "./sections/ChatSection";
import ProfileSection from "./sections/ProfileSection";
import SettingsSection from "./sections/SettingsSection";
import { SectionState } from "./WebsiteUI";
import { useAsyncResource } from "./hooks/useAsyncResource";
import { fetchRightPanelNews, fetchSuggestedUsers } from "./services/websiteApi";
import { createFeedPost, deleteFeedPost, updateFeedPost } from "./services/postApi";
import { reportFeedPost } from "./services/reportApi";
import { fetchConversations } from "./services/chatApi";
import {
  addPostComment,
  fetchSocialState,
  hideFeedPost,
  toggleHandleBlock,
  toggleHandleFollow,
  togglePostBookmark,
  togglePostLike,
  togglePostRepost,
  toggleSuggestedFollow,
} from "./services/socialApi";
import { logoutUser } from "../utils/authApi";
import { updateUserProfile } from "../utils/profileApi";
import { clearSession } from "../utils/session";
import "./WebsiteShell.css";

const NAV_ICONS = {
  Home: House,
  Explore: Search,
  Notifications: Bell,
  Bookmarks: Bookmark,
  Chat: Mail,
  Profile: User,
  Settings: SettingsIcon,
};
const QUICK_PANEL_ANIMATION_MS = 360;
function WebsiteShell({ setIsAuthenticated }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickPanel, setQuickPanel] = useState(null);
  const [closingQuickPanel, setClosingQuickPanel] = useState(null);
  const [queuedQuickPanel, setQueuedQuickPanel] = useState(null);
  const [followedUserIds, setFollowedUserIds] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [authoredPosts, setAuthoredPosts] = useState([]);
  const [repostedPosts, setRepostedPosts] = useState([]);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [hiddenPostIds, setHiddenPostIds] = useState([]);
  const [blockedHandles, setBlockedHandles] = useState([]);
  const [followedHandles, setFollowedHandles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [composerFocusSignal, setComposerFocusSignal] = useState(0);
  const [rightSearchQuery, setRightSearchQuery] = useState("");
  const [socialStateVersion, setSocialStateVersion] = useState(0);
  const [quickChats, setQuickChats] = useState([]);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
  const [hasSeenChats, setHasSeenChats] = useState(false);
  const prevNotifLengthRef = useRef(0);
  const prevChatUnreadCountRef = useRef(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab = NAV_ITEMS.includes(tabFromUrl) ? tabFromUrl : "Home";

  const [username, setUsername] = useState(() => localStorage.getItem("personalUsername") || "user");
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("displayName") || "GupShup User");
  const {
    data: rightPanelNews,
    isLoading: newsLoading,
    error: newsError,
  } = useAsyncResource(fetchRightPanelNews, []);
  const {
    data: suggestedUsers,
    isLoading: usersLoading,
    error: usersError,
  } = useAsyncResource(fetchSuggestedUsers, []);
  const {
    data: socialState,
  } = useAsyncResource(fetchSocialState, {
    likedPostIds: [],
    bookmarkedPostIds: [],
    repostedPosts: [],
    commentsByPost: {},
    hiddenPostIds: [],
    blockedHandles: [],
    followedHandles: [],
    followedUserIds: [],
    followers: [],
    notifications: [],
  }, [socialStateVersion]);
  const followedUsers = useMemo(
    () => (suggestedUsers || []).filter((user) => user && (followedUserIds?.includes(user.id) || followedHandles?.includes(user.handle))),
    [suggestedUsers, followedUserIds, followedHandles],
  );
  // followingCount and followersCount come directly from the server to avoid double-counting
  // (a Follow record has both handle + suggestedUserId for the same person)
  const repostedPostIds = useMemo(() => repostedPosts.map((post) => post.id), [repostedPosts]);

  useEffect(() => {
    setLikedPostIds(socialState.likedPostIds || []);
    setBookmarkedPostIds(socialState.bookmarkedPostIds || []);
    setRepostedPosts(socialState.repostedPosts || []);
    setCommentsByPost(socialState.commentsByPost || {});
    setHiddenPostIds(socialState.hiddenPostIds || []);
    setBlockedHandles(socialState.blockedHandles || []);
    setFollowedHandles(socialState.followedHandles || []);
    setFollowedUserIds(socialState.followedUserIds || []);
    setFollowers(socialState.followers || []);
    setFollowingCount(socialState.followingCount ?? 0);
    setFollowersCount(socialState.followersCount ?? 0);
    setNotifications(socialState.notifications || []);
  }, [socialState]);

  useEffect(() => {
    const currentLength = notifications ? notifications.length : 0;
    if (currentLength > prevNotifLengthRef.current) {
      setHasSeenNotifications(false);
    }
    prevNotifLengthRef.current = currentLength;
  }, [notifications]);

  useEffect(() => {
    const unreadCount = (quickChats || []).filter(c => c?.unread).length;
    if (unreadCount > prevChatUnreadCountRef.current) {
      setHasSeenChats(false);
    }
    prevChatUnreadCountRef.current = unreadCount;
  }, [quickChats]);

  useEffect(() => {
    fetchConversations().then(data => {
      if (Array.isArray(data)) {
        setQuickChats(data);
      } else {
        setQuickChats([]);
      }
    }).catch(() => {
      setQuickChats([]);
    });
  }, [socialStateVersion]);

  const handleLogout = async () => {
    try {
      await logoutUser(localStorage.getItem("refreshToken"));
    } catch {
      // Keep logout resilient on the client even if the server is unavailable.
    } finally {
      clearSession();
      setIsAuthenticated(false);
    }
  };

  const handleTabChange = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", item);
    setSearchParams(next, { replace: true });
  };
  const handlePostCtaClick = () => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "Home");
    setSearchParams(next, { replace: true });
    setComposerFocusSignal(Date.now());
  };

  const handleRightSearchSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.set("tab", "Explore");
    const query = rightSearchQuery.trim();
    if (query) {
      next.set("q", query);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  const handleFollowToggle = async (user) => {
    const response = await toggleSuggestedFollow(user.id, user.handle, user.name);
    setFollowedUserIds((prev) => (
      response.active ? [...new Set([...prev, user.id])] : prev.filter((id) => id !== user.id)
    ));
    setSocialStateVersion((v) => v + 1);
  };

  const handleCreatePost = async ({ text, mediaUrl, mediaType }) => {
    const newPost = await createFeedPost({
      text,
      mediaUrl,
      mediaType,
    });
    setAuthoredPosts((prev) => [newPost, ...prev]);
  };

  const handleRepostToggle = async (post) => {
    if (!post?.id) return;
    const response = await togglePostRepost(post.id, post);
    setRepostedPosts((prev) => (
      response.active
        ? [{ ...post, repostedAt: Date.now() }, ...prev.filter((item) => item.id !== post.id)]
        : prev.filter((item) => item.id !== post.id)
    ));
  };
  const handleLikeToggle = async (postId) => {
    const response = await togglePostLike(postId);
    setLikedPostIds((prev) => (
      response.active ? [...new Set([...prev, postId])] : prev.filter((id) => id !== postId)
    ));
  };
  const handleAddComment = async (postId, text) => {
    const nextText = text.trim();
    if (!postId || !nextText) return;
    const nextComment = await addPostComment(postId, nextText);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), nextComment],
    }));
  };
  const handleBookmarkToggle = async (postId) => {
    const response = await togglePostBookmark(postId);
    setBookmarkedPostIds((prev) => (
      response.active ? [...new Set([...prev, postId])] : prev.filter((id) => id !== postId)
    ));
  };
  const handleHidePost = async (postId) => {
    if (!postId) return;
    await hideFeedPost(postId);
    setHiddenPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
  };
  const handleBlockHandle = async (handle) => {
    const nextHandle = String(handle || "").trim();
    if (!nextHandle) return;
    const response = await toggleHandleBlock(nextHandle);
    setBlockedHandles((prev) => (
      response.blocked ? [...new Set([...prev, nextHandle])] : prev.filter((item) => item !== nextHandle)
    ));
    if (response.blocked) {
      setFollowedHandles((prev) => prev.filter((item) => item !== nextHandle));
    }
  };
  const handleToggleFollowHandle = async (handle) => {
    const nextHandle = String(handle || "").trim();
    if (!nextHandle) return;
    const response = await toggleHandleFollow(nextHandle);
    setFollowedHandles((prev) => (
      response.active ? [...new Set([...prev, nextHandle])] : prev.filter((item) => item !== nextHandle)
    ));
    // Refresh social state to get updated follower/following counts
    setSocialStateVersion((v) => v + 1);
  };
  const handleReportPost = async (post) => {
    if (!post?.id) return;
    await reportFeedPost(post.id, {
      handle: post.handle,
      reason: "Reported from feed actions",
    });
  };
  const handleDeletePost = async (postId) => {
    if (!postId) return;
    await deleteFeedPost(postId);
    setAuthoredPosts((prev) => prev.filter((post) => post.id !== postId));
    setRepostedPosts((prev) => prev.filter((post) => post.id !== postId));
    setLikedPostIds((prev) => prev.filter((id) => id !== postId));
    setBookmarkedPostIds((prev) => prev.filter((id) => id !== postId));
    setCommentsByPost((prev) => {
      if (!prev[postId]) return prev;
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  };
  const handleEditPost = async (postId, nextText) => {
    const text = String(nextText || "").trim();
    if (!postId || !text) return;
    const updatedPost = await updateFeedPost(postId, text);
    setAuthoredPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, text: updatedPost.text } : post
    )));
  };
  const handleUpdateProfile = async ({ name, username: nextUsername, bio, avatarColor }) => {
    const response = await updateUserProfile({
      name,
      username: nextUsername,
      bio,
      avatarColor,
    });

    localStorage.setItem("displayName", response.user.name || "");
    localStorage.setItem("personalUsername", response.user.username || "");
    localStorage.setItem("userEmail", response.user.email || "");
    localStorage.setItem("userGender", response.user.gender || "Not set");
    localStorage.setItem("userCountry", response.user.country || "India");
    localStorage.setItem("userLanguages", response.user.languages || "English, Hindi");
    localStorage.setItem("user", JSON.stringify(response.user));
    setDisplayName(response.user.name || "GupShup User");
    setUsername(response.user.username || "user");
    return response.user;
  };

  const sectionByTab = {
    Home: (
      <HomeSection
        displayName={displayName}
        username={username}
        authoredPosts={authoredPosts}
        onCreatePost={handleCreatePost}
        repostedPostIds={repostedPostIds}
        onToggleRepost={handleRepostToggle}
        likedPostIds={likedPostIds}
        onToggleLike={handleLikeToggle}
        bookmarkedPostIds={bookmarkedPostIds}
        onToggleBookmark={handleBookmarkToggle}
        hiddenPostIds={hiddenPostIds}
        blockedHandles={blockedHandles}
        followedHandles={followedHandles}
        onHidePost={handleHidePost}
        onBlockHandle={handleBlockHandle}
        onToggleFollowHandle={handleToggleFollowHandle}
        onReportPost={handleReportPost}
        onDeletePost={handleDeletePost}
        onEditPost={handleEditPost}
        commentsByPost={commentsByPost}
        onAddComment={handleAddComment}
        composerFocusSignal={composerFocusSignal}
      />
    ),
    Explore: (
      <ExploreSection 
        onToggleFollowHandle={handleToggleFollowHandle} 
        followedHandles={followedHandles}
      />
    ),
    Notifications: <NotificationsSection externalNotifications={notifications} />,
    Bookmarks: (
      <BookmarksSection
        authoredPosts={authoredPosts}
        bookmarkedPostIds={bookmarkedPostIds}
        onToggleBookmark={handleBookmarkToggle}
        repostedPostIds={repostedPostIds}
        onToggleRepost={handleRepostToggle}
        likedPostIds={likedPostIds}
        onToggleLike={handleLikeToggle}
        commentsByPost={commentsByPost}
        onAddComment={handleAddComment}
      />
    ),
    Chat: <ChatSection username={username} />,
    Profile: (
      <ProfileSection
        displayName={displayName}
        username={username}
        followers={followers}
        followersCount={followersCount}
        followedUsers={followedUsers}
        followingCount={followingCount}
        authoredPosts={authoredPosts}
        repostedPosts={repostedPosts}
        repostedPostIds={repostedPostIds}
        onToggleRepost={handleRepostToggle}
        likedPostIds={likedPostIds}
        onToggleLike={handleLikeToggle}
        bookmarkedPostIds={bookmarkedPostIds}
        onToggleBookmark={handleBookmarkToggle}
        commentsByPost={commentsByPost}
        onAddComment={handleAddComment}
        onUpdateProfile={handleUpdateProfile}
      />
    ),
    Settings: <SettingsSection />,
  };

  const hideRightBar = activeTab === "Chat" || activeTab === "Settings";
  const showNotificationsQuickAction = activeTab !== "Notifications";
  const renderedQuickPanel = quickPanel || closingQuickPanel;
  const isQuickPanelClosing = !quickPanel && Boolean(closingQuickPanel);

  const toggleQuickPanel = (panelName) => {
    if (quickPanel === panelName) {
      setQueuedQuickPanel(null);
      setClosingQuickPanel(panelName);
      setQuickPanel(null);
      return;
    }
    if (quickPanel && quickPanel !== panelName) {
      setQueuedQuickPanel(panelName);
      setClosingQuickPanel(quickPanel);
      setQuickPanel(null);
      return;
    }
    setClosingQuickPanel(null);
    setQueuedQuickPanel(null);
    setQuickPanel(panelName);
  };

  useEffect(() => {
    if (!showNotificationsQuickAction && quickPanel === "notifications") {
      setQueuedQuickPanel(null);
      setClosingQuickPanel("notifications");
      setQuickPanel(null);
    }
    if (quickPanel === "notifications") {
      setHasSeenNotifications(true);
    }
    if (quickPanel === "chat") {
      setHasSeenChats(true);
    }
  }, [showNotificationsQuickAction, quickPanel]);

  useEffect(() => {
    if (!closingQuickPanel) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setClosingQuickPanel(null);
      if (queuedQuickPanel) {
        setQuickPanel(queuedQuickPanel);
        setQueuedQuickPanel(null);
      }
    }, QUICK_PANEL_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [closingQuickPanel, queuedQuickPanel]);

  return (
    <div className={`ws-root ${hideRightBar ? "ws-no-rightbar" : ""}`}>
      <aside className="ws-sidebar">
        <div className="ws-logo-mark" aria-label="GupShup logo">
          <img className="ws-logo-light" src={logoNoNameLight} alt="" />
          <img className="ws-logo-dark" src={logoNoNameDark} alt="" />
        </div>
        <div className="ws-sidebar-stack">
          <nav className="ws-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item];
              return (
              <button
                key={item}
                type="button"
                className={`ws-nav-item ${activeTab === item ? "active" : ""}`}
                onClick={() => handleTabChange(item)}
                aria-current={activeTab === item ? "page" : undefined}
              >
                <span className="ws-nav-icon"><Icon strokeWidth={2.2} /></span>
                <span>{item}</span>
              </button>
              );
            })}
          </nav>

          <button type="button" className="ws-post-cta" onClick={handlePostCtaClick}>
            Post
          </button>

          <button
            type="button"
            className="ws-sidebar-profile"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((prev) => !prev)}
          >
            <div className="ws-sidebar-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
            <div className="ws-sidebar-meta">
              <strong>{displayName}</strong>
              <span>@{username}</span>
            </div>
            <span className="ws-sidebar-more" aria-hidden="true">
              <Ellipsis size={26} />
            </span>
            {profileMenuOpen && (
              <div className="ws-profile-menu">
                <button
                  type="button"
                  className="ws-profile-menu-item"
                >
                  Add an existing account
                </button>
                <button
                  type="button"
                  className="ws-profile-menu-item"
                  onClick={handleLogout}
                >
                  Log out @{username}
                </button>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className={`ws-main ${activeTab === "Chat" ? "ws-main-chat" : ""} ${activeTab === "Settings" ? "ws-main-settings" : ""}`}>
        {sectionByTab[activeTab]}
      </main>

      {!hideRightBar && (
        <aside className="ws-rightbar">
          <form className="ws-rightbar-search" onSubmit={handleRightSearchSubmit}>
            <Search size={17} strokeWidth={2} />
            <input
              type="search"
              value={rightSearchQuery}
              onChange={(event) => setRightSearchQuery(event.target.value)}
              placeholder="Search and go to Explore"
              aria-label="Search from widgets"
            />
          </form>

          <section className="ws-widget">
            <h3>Today&apos;s Trending</h3>
            <SectionState
              isLoading={newsLoading}
              error={newsError}
              isEmpty={!(rightPanelNews || []).length}
              emptyText="No news available."
            />
            <div className="ws-trend-list">
              {(rightPanelNews || []).map((headline) => (
                <div key={headline} className="ws-trend-item">
                  <strong>{headline}</strong>
                  <span>Trending now</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ws-widget">
            <h3>Who to follow</h3>
            <SectionState
              isLoading={usersLoading}
              error={usersError}
              isEmpty={!(suggestedUsers || []).length}
              emptyText="No suggestions right now."
            />
            <div className="ws-follow-list">
              {(suggestedUsers || []).map((user) => (
                <div key={user?.id || Math.random()} className="ws-follow-item">
                  <div className="ws-follow-main">
                    <div className="ws-follow-avatar" aria-hidden="true">
                      {user?.name?.slice(0, 1).toUpperCase() || "?"}
                    </div>
                    <div className="ws-follow-copy">
                      <strong>{user?.name || "GupShup User"}</strong>
                      <span>{user?.handle || "@user"}</span>
                      {(user?.followersCount ?? 0) > 0 && (
                        <span className="ws-follow-count">
                          {user.followersCount.toLocaleString()} follower{user.followersCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`ws-follow-btn ${followedUserIds.includes(user.id) ? "is-following" : ""}`}
                    aria-pressed={followedUserIds.includes(user.id)}
                    onClick={() => handleFollowToggle(user)}
                  >
                    {followedUserIds.includes(user.id) ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="ws-quick-actions" aria-label="Quick actions">
            {showNotificationsQuickAction && (
              <button
                type="button"
                className={`ws-quick-btn ${quickPanel === "notifications" ? "active" : ""}`}
                aria-label="Notifications panel"
                aria-expanded={quickPanel === "notifications"}
                onClick={() => toggleQuickPanel("notifications")}
                style={{ position: "relative" }}
              >
                <Bell size={22} strokeWidth={2} />
                {!hasSeenNotifications && (notifications || []).length > 0 && (
                  <span className="ws-quick-badge" style={{ position: "absolute", top: "0", right: "0", background: "#f43f5e", color: "white", fontSize: "0.65rem", fontWeight: "bold", padding: "0.1rem 0.35rem", borderRadius: "10px", pointerEvents: "none", transform: "translate(25%, -25%)" }}>{(notifications || []).length}</span>
                )}
              </button>
            )}
            <button
              type="button"
              className={`ws-quick-btn ${quickPanel === "chat" ? "active" : ""}`}
              aria-label="Chat panel"
              aria-expanded={quickPanel === "chat"}
              onClick={() => toggleQuickPanel("chat")}
              style={{ position: "relative" }}
            >
              <Mail size={22} strokeWidth={2} />
              {!hasSeenChats && (quickChats || []).filter(c => c?.unread).length > 0 && (
                  <span className="ws-quick-badge" style={{ position: "absolute", top: "0", right: "0", background: "#f43f5e", color: "white", fontSize: "0.65rem", fontWeight: "bold", padding: "0.1rem 0.35rem", borderRadius: "10px", pointerEvents: "none", transform: "translate(25%, -25%)" }}>{(quickChats || []).filter(c => c?.unread).length}</span>
              )}
            </button>

            {renderedQuickPanel && (
              <section
                className={`ws-quick-panel ${isQuickPanelClosing ? "is-closing" : "is-opening"}`}
                role="dialog"
                aria-label={`${renderedQuickPanel} panel`}
              >
                <header className="ws-quick-panel-head">
                  <h4>{renderedQuickPanel === "chat" ? "Chat" : "Notifications"}</h4>
                </header>

                <div className="ws-quick-search">
                  <Search size={18} strokeWidth={2} />
                  <input
                    type="text"
                    className="ws-quick-search-input"
                    placeholder={renderedQuickPanel === "chat" ? "Search chats" : "Search notifications"}
                  />
                </div>

                {renderedQuickPanel === "chat" ? (
                  <>
                    <div className="ws-quick-tabs">
                      <button type="button" className="active">All</button>
                      <button type="button">Requests</button>
                    </div>
                    <div className="ws-quick-list">
                      {(quickChats || []).length > 0 ? (quickChats || []).slice(0, 5).map(chat => (
                        <article key={chat.id} className="ws-quick-row">
                          <div className="ws-quick-avatar" aria-hidden="true">{chat?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                          <div className="ws-quick-copy">
                            <strong>{chat.name}</strong>
                            <span>{chat.preview || "No messages yet"}</span>
                          </div>
                          <small>{chat.time}</small>
                        </article>
                      )) : (
                        <div style={{ padding: "1rem", textAlign: "center", opacity: 0.7 }}>No chats yet</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="ws-quick-list">
                    {(notifications || []).length > 0 ? (notifications || []).slice(0, 5).map(notif => (
                        <article key={notif.id} className="ws-quick-row">
                          <div className="ws-quick-avatar" aria-hidden="true">{notif?.type?.charAt(0)?.toUpperCase() || "N"}</div>
                          <div className="ws-quick-copy">
                            <strong>{notif.type === "follow" ? "New Follower" : "Notification"}</strong>
                            <span>{notif.message}</span>
                          </div>
                          <small>{notif.time}</small>
                        </article>
                    )) : (
                        <div style={{ padding: "1rem", textAlign: "center", opacity: 0.7 }}>No notifications</div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

export default WebsiteShell;



