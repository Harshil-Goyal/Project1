import { useMemo, useRef, useState } from "react";
import { Bookmark, Heart, MessageCircle, Repeat2, Share2, X, Camera } from "lucide-react";
import { SectionState } from "../WebsiteUI";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { fetchFeedPosts } from "../services/websiteApi";

const PROFILE_BIO_KEY = "ws_profile_bio_v1";
const PROFILE_AVATAR_COLOR_KEY = "ws_profile_avatar_color_v1";

function ProfileSection({
  displayName,
  username,
  followers = [],
  followersCount,
  followedUsers = [],
  authoredPosts = [],
  repostedPosts = [],
  repostedPostIds = [],
  onToggleRepost,
  likedPostIds = [],
  onToggleLike,
  bookmarkedPostIds = [],
  onToggleBookmark,
  commentsByPost = {},
  onAddComment,
  onUpdateProfile,
  followingCount: externalFollowingCount,
}) {
  const { data: posts, isLoading, error } = useAsyncResource(fetchFeedPosts, []);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [sharePost, setSharePost] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(() => localStorage.getItem(PROFILE_BIO_KEY) || "");
  const [editAvatarColor, setEditAvatarColor] = useState(() => localStorage.getItem(PROFILE_AVATAR_COLOR_KEY) || "#3cd5b5");
  const [bio, setBio] = useState(() => localStorage.getItem(PROFILE_BIO_KEY) || "");
  const [avatarColor, setAvatarColor] = useState(() => localStorage.getItem(PROFILE_AVATAR_COLOR_KEY) || "#3cd5b5");
  const colorInputRef = useRef(null);

  const followingCount = typeof externalFollowingCount === "number" ? externalFollowingCount : followedUsers.length;
  const mergedPosts = useMemo(() => [...authoredPosts, ...posts], [authoredPosts, posts]);
  const myPosts = useMemo(
    () => mergedPosts.filter((post) => post.handle === `@${username}`),
    [mergedPosts, username],
  );
  const repostItems = useMemo(
    () => [...repostedPosts].sort((a, b) => (b.repostedAt || 0) - (a.repostedAt || 0)),
    [repostedPosts],
  );
  const mediaItems = useMemo(
    () => myPosts.filter((post) => Boolean(post.image || post.video)),
    [myPosts],
  );
  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPostIds), [bookmarkedPostIds]);
  const repostedSet = useMemo(() => new Set(repostedPostIds), [repostedPostIds]);
  const getCommentsForPost = (post) => [...(post.comments || []), ...(commentsByPost[post.id] || [])];
  const getCommentCount = (post) => {
    const baseCount = typeof post.stats?.comments === "number" ? post.stats.comments : (post.comments?.length || 0);
    return baseCount + (commentsByPost[post.id]?.length || 0);
  };
  const preventPostOpen = (event) => event.stopPropagation();
  const handleAddComment = () => {
    const nextText = commentDraft.trim();
    if (!activeCommentPost?.id || !nextText) return;
    onAddComment?.(activeCommentPost.id, nextText);
    setCommentDraft("");
  };

  const handleSaveProfile = async () => {
    try {
      localStorage.setItem(PROFILE_BIO_KEY, editBio);
      localStorage.setItem(PROFILE_AVATAR_COLOR_KEY, editAvatarColor);
      await onUpdateProfile?.({
        name: editName,
        username: editUsername,
        bio: editBio,
        avatarColor: editAvatarColor,
      });
      setBio(editBio);
      setAvatarColor(editAvatarColor);
      setEditProfileOpen(false);
    } catch (error) {
      window.alert(error.message || "Unable to update profile");
    }
  };

  const avatarStyle = { background: `linear-gradient(45deg, ${avatarColor}, #4d71dc)` };

  const renderPostActions = (post, isRepost = false) => (
    <div className="ws-feed-stats">
      <button type="button" className="ws-action-btn" onClick={(event) => { preventPostOpen(event); setActiveCommentPost(post); }}>
        <MessageCircle size={16} />
        <span>{getCommentCount(post)}</span>
      </button>
      <button type="button" className={`ws-action-btn ${isRepost ? "active" : repostedSet.has(post.id) ? "active" : ""}`} onClick={(event) => { preventPostOpen(event); onToggleRepost?.(post); }}>
        <Repeat2 size={16} />
        <span>{(post.stats?.reposts || 0) + (repostedSet.has(post.id) ? 1 : 0)}</span>
      </button>
      <button type="button" className={`ws-action-btn ws-like-btn ${likedSet.has(post.id) ? "liked" : ""}`} onClick={(event) => { preventPostOpen(event); onToggleLike?.(post.id); }}>
        <Heart size={16} fill={likedSet.has(post.id) ? "currentColor" : "none"} />
        <span>{(post.stats?.likes || 0) + (likedSet.has(post.id) ? 1 : 0)}</span>
      </button>
      <button type="button" className={`ws-action-btn ${bookmarkedSet.has(post.id) ? "active" : ""}`} onClick={(event) => { preventPostOpen(event); onToggleBookmark?.(post.id); }}>
        <Bookmark size={16} fill={bookmarkedSet.has(post.id) ? "currentColor" : "none"} />
      </button>
      <button type="button" className="ws-action-btn" onClick={(event) => { preventPostOpen(event); setSharePost(post); }}>
        <Share2 size={16} />
        <span>{post.stats?.shares || 0}</span>
      </button>
    </div>
  );

  const renderPost = (post, key, isRepost = false) => (
    <article key={key} className="ws-feed-row ws-clickable-post" onClick={() => setActiveCommentPost(post)}>
      <div className="ws-feed-top">
        <strong>{post.author}</strong>
        <span>{post.handle}</span>
        {isRepost && <span>- reposted by you</span>}
        {!isRepost && <span>- {post.time || (typeof post.ageMinutes === "number" ? `${post.ageMinutes}m` : "now")}</span>}
      </div>
      {post.text && <p>{post.text}</p>}
      {post.image && <div className="ws-feed-media"><img src={post.image} alt={`Post by ${post.author}`} loading="lazy" /></div>}
      {post.video && <div className="ws-feed-media"><video src={post.video} controls preload="metadata" /></div>}
      {renderPostActions(post, isRepost)}
    </article>
  );

  return (
    <section className="ws-panel ws-x-section ws-profile-section">
      {/* Profile Hero — no banner, centered avatar */}
      <div className="ws-profile-hero-center">
        <div className="ws-profile-avatar-center" style={avatarStyle}>
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <h2 className="ws-profile-center-name">{displayName}</h2>
        <p className="ws-profile-center-handle">@{username}</p>
        {bio && <p className="ws-profile-center-bio">{bio}</p>}

        <div className="ws-profile-center-row">
          <div className="ws-profile-stats">
            <button
              type="button"
              className={`ws-profile-stat-btn ${showFollowingList ? "active" : ""}`}
              aria-expanded={showFollowingList}
              onClick={() => setShowFollowingList((prev) => !prev)}
            >
              <strong>{followingCount}</strong> Following
            </button>
            <span><strong>{followersCount ?? followers.length}</strong> Followers</span>
            <span><strong>{myPosts.length}</strong> Posts</span>
          </div>
          <button type="button" className="ws-profile-edit-btn" onClick={() => {
            setEditName(displayName);
            setEditUsername(username);
            setEditBio(bio);
            setEditAvatarColor(avatarColor);
            setEditProfileOpen(true);
          }}>
            Edit Profile
          </button>
        </div>

        {showFollowingList && (
          <div className="ws-profile-following-card">
            <h4>Your following list</h4>
            {!followedUsers.length && <p>Follow users from the right panel to see them here.</p>}
            {!!followedUsers.length && (
              <div className="ws-profile-following-list">
                {followedUsers.map((user) => (
                  <div key={user.id} className="ws-profile-following-row">
                    <strong>{user.name}</strong>
                    <span>{user.handle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ws-tabbar">
        <button type="button" className={activeTab === "posts" ? "active" : ""} onClick={() => setActiveTab("posts")}>Posts</button>
        <button type="button" className={activeTab === "reposts" ? "active" : ""} onClick={() => setActiveTab("reposts")}>Reposts</button>
        <button type="button" className={activeTab === "media" ? "active" : ""} onClick={() => setActiveTab("media")}>Media</button>
      </div>

      {activeTab === "posts" && (
        <>
          <SectionState isLoading={isLoading} error={error} isEmpty={!myPosts.length} emptyText="No posts yet." />
          <div className="ws-feed">
            {myPosts.map((post) => renderPost(post, post.id))}
          </div>
        </>
      )}

      {activeTab === "reposts" && (
        <section className="ws-profile-reposts">
          <SectionState isLoading={isLoading} error={error} isEmpty={!repostItems.length} emptyText="No reposts yet." />
          {repostItems.map((post) => renderPost(post, `repost-${post.id}`, true))}
        </section>
      )}

      {activeTab === "media" && (
        <section className="ws-profile-media">
          <SectionState isLoading={isLoading} error={error} isEmpty={!mediaItems.length} emptyText="No media posts yet." />
          <div className="ws-profile-media-grid">
            {mediaItems.map((post) => (
              <article key={post.id} className="ws-profile-media-card">
                {post.image && <img src={post.image} alt={`Media by ${post.author}`} loading="lazy" />}
                {post.video && <video src={post.video} controls preload="metadata" />}
                <p>{post.text || "Media post"}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Comment modal — full middle section, no backdrop filter */}
      {activeCommentPost && (
        <div className="ws-comment-fullscreen" role="dialog" aria-label="Post comments">
          <header className="ws-comment-modal-head">
            <h3>Post</h3>
            <button type="button" onClick={() => setActiveCommentPost(null)} aria-label="Close comments">
              <X size={20} />
            </button>
          </header>
          <div className="ws-comment-fullscreen-body">
            <article className="ws-feed-row">
              <div className="ws-feed-top">
                <strong>{activeCommentPost.author}</strong>
                <span>{activeCommentPost.handle}</span>
              </div>
              {activeCommentPost.text && <p>{activeCommentPost.text}</p>}
              {activeCommentPost.image && <div className="ws-feed-media"><img src={activeCommentPost.image} alt={`Post by ${activeCommentPost.author}`} loading="lazy" /></div>}
              {activeCommentPost.video && <div className="ws-feed-media"><video src={activeCommentPost.video} controls preload="metadata" /></div>}
            </article>
            <div className="ws-comment-list">
              {getCommentsForPost(activeCommentPost).map((comment) => (
                <article key={comment.id} className="ws-comment-row">
                  <strong>{comment.author}</strong>
                  <span>{comment.handle}</span>
                  <p>{comment.text}</p>
                </article>
              ))}
              {!getCommentsForPost(activeCommentPost).length && (
                <p className="ws-state-msg">No comments yet.</p>
              )}
            </div>
            <div className="ws-comment-input-wrap">
              <textarea
                className="ws-comment-input"
                placeholder="Post your reply"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                maxLength={280}
              />
              <button type="button" className="ws-post-btn" onClick={handleAddComment} disabled={!commentDraft.trim()}>
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div className="ws-comment-modal-backdrop" role="presentation" onClick={() => setEditProfileOpen(false)}>
          <section className="ws-edit-profile-modal" role="dialog" aria-label="Edit profile" onClick={(e) => e.stopPropagation()}>
            <header className="ws-comment-modal-head">
              <h3>Edit Profile</h3>
              <button type="button" onClick={() => setEditProfileOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </header>
            <div className="ws-edit-profile-body">
              <div className="ws-edit-avatar-wrap">
                <div
                  className="ws-edit-avatar-preview"
                  style={{ background: `linear-gradient(45deg, ${editAvatarColor}, #4d71dc)` }}
                >
                  {editName.slice(0, 1).toUpperCase()}
                </div>
                <button
                  type="button"
                  className="ws-edit-avatar-btn"
                  onClick={() => colorInputRef.current?.click()}
                  aria-label="Change avatar color"
                >
                  <Camera size={16} /> Change color
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={editAvatarColor}
                  onChange={(e) => setEditAvatarColor(e.target.value)}
                  style={{ display: "none" }}
                />
              </div>

              <label className="ws-edit-field">
                <span>Display Name</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                />
              </label>
              <label className="ws-edit-field">
                <span>Username</span>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                  maxLength={20}
                />
              </label>
              <label className="ws-edit-field">
                <span>Bio</span>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  maxLength={160}
                  rows={3}
                />
              </label>

              <button type="button" className="ws-post-btn ws-edit-save-btn" onClick={handleSaveProfile}>
                Save
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Share modal */}
      {sharePost && (
        <div className="ws-comment-modal-backdrop" role="presentation" onClick={() => setSharePost(null)}>
          <section className="ws-share-modal" role="dialog" aria-label="Share post" onClick={(e) => e.stopPropagation()}>
            <header className="ws-comment-modal-head">
              <h3>Share post</h3>
              <button type="button" onClick={() => setSharePost(null)} aria-label="Close"><X size={20} /></button>
            </header>
            <div className="ws-share-body">
              <p className="ws-share-subtitle">Share to your chats or people you follow</p>
              {[...followedUsers].length === 0 && (
                <p className="ws-state-msg">Follow people to share posts with them.</p>
              )}
              {followedUsers.map((user) => (
                <div key={user.id} className="ws-share-row">
                  <div className="ws-share-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
                  <div className="ws-share-copy">
                    <strong>{user.name}</strong>
                    <span>{user.handle}</span>
                  </div>
                  <button type="button" className="ws-share-send-btn" onClick={() => setSharePost(null)}>Send</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default ProfileSection;
