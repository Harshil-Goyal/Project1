import { useMemo, useState } from "react";
import { Bookmark, Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { SectionState } from "../WebsiteUI";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { fetchFeedPosts } from "../services/websiteApi";

function formatAge(minutesAgo) {
  if (minutesAgo < 1) return "now";
  if (minutesAgo < 60) return `${minutesAgo}m`;
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}h`;
  return `${Math.floor(minutesAgo / 1440)}d`;
}

function BookmarksSection({
  authoredPosts = [],
  bookmarkedPostIds = [],
  onToggleBookmark,
  repostedPostIds = [],
  onToggleRepost,
  likedPostIds = [],
  onToggleLike,
  commentsByPost = {},
  onAddComment,
}) {
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const { data: posts, isLoading, error } = useAsyncResource(fetchFeedPosts, []);
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPostIds), [bookmarkedPostIds]);
  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const repostedSet = useMemo(() => new Set(repostedPostIds), [repostedPostIds]);
  const allPosts = useMemo(() => [...authoredPosts, ...posts], [authoredPosts, posts]);
  const bookmarkedPosts = useMemo(
    () => allPosts.filter((post) => bookmarkedSet.has(post.id)),
    [allPosts, bookmarkedSet],
  );
  const preventPostOpen = (event) => event.stopPropagation();
  const getCommentCount = (post) => {
    const baseCount = typeof post.stats?.comments === "number" ? post.stats.comments : (post.comments?.length || 0);
    return baseCount + (commentsByPost[post.id]?.length || 0);
  };
  const getCommentsForPost = (post) => [...(post.comments || []), ...(commentsByPost[post.id] || [])];
  const handleAddComment = () => {
    const nextText = commentDraft.trim();
    if (!activeCommentPost?.id || !nextText) return;
    onAddComment?.(activeCommentPost.id, nextText);
    setCommentDraft("");
  };

  return (
    <section className="ws-panel ws-x-section ws-bookmarks-section">
      <header className="ws-header-row">
        <h1 className="ws-page-title">Bookmarks</h1>
      </header>

      <SectionState
        isLoading={isLoading}
        error={error}
        isEmpty={!bookmarkedPosts.length}
        emptyText="No bookmarked posts yet."
      />

      <div className="ws-feed">
        {bookmarkedPosts.map((post) => (
          <article key={post.id} className="ws-feed-row ws-clickable-post" onClick={() => setActiveCommentPost(post)}>
            <div className="ws-feed-top">
              <img className="ws-feed-avatar" src={post.avatar} alt={post.author} loading="lazy" />
              <div className="ws-feed-meta">
                <div className="ws-feed-author-row">
                  <strong>{post.author}</strong>
                  <span>{post.handle}</span>
                  <span>- {formatAge(post.ageMinutes || 0)}</span>
                </div>
              </div>
            </div>
            {post.text && <p>{post.text}</p>}
            {post.image && (
              <div className="ws-feed-media">
                <img src={post.image} alt={`Post by ${post.author}`} loading="lazy" />
              </div>
            )}
            {post.video && (
              <div className="ws-feed-media">
                <video src={post.video} controls preload="metadata" />
              </div>
            )}
            <div className="ws-feed-stats">
              <button type="button" className="ws-action-btn" onClick={(event) => { preventPostOpen(event); setActiveCommentPost(post); }}>
                <MessageCircle size={16} />
                <span>{getCommentCount(post)}</span>
              </button>
              <button
                type="button"
                className={`ws-action-btn ${repostedSet.has(post.id) ? "active" : ""}`}
                onClick={(event) => {
                  preventPostOpen(event);
                  onToggleRepost?.(post);
                }}
              >
                <Repeat2 size={16} />
                <span>{(post.stats?.reposts || 0) + (repostedSet.has(post.id) ? 1 : 0)}</span>
              </button>
              <button
                type="button"
                className={`ws-action-btn ws-like-btn ${likedSet.has(post.id) ? "liked" : ""}`}
                onClick={(event) => {
                  preventPostOpen(event);
                  onToggleLike?.(post.id);
                }}
              >
                <Heart size={16} fill={likedSet.has(post.id) ? "currentColor" : "none"} />
                <span>{(post.stats?.likes || 0) + (likedSet.has(post.id) ? 1 : 0)}</span>
              </button>
              <button
                type="button"
                className="ws-action-btn active"
                onClick={(event) => {
                  preventPostOpen(event);
                  onToggleBookmark?.(post.id);
                }}
                aria-label="Remove bookmark"
              >
                <Bookmark size={16} fill="currentColor" />
              </button>
              <button type="button" className="ws-action-btn" onClick={preventPostOpen}>
                <Share2 size={16} />
                <span>{post.stats?.shares || 0}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeCommentPost && (
        <div className="ws-comment-modal-backdrop" role="presentation" onClick={() => setActiveCommentPost(null)}>
          <section className="ws-comment-modal" role="dialog" aria-label="Post comments" onClick={(event) => event.stopPropagation()}>
            <header className="ws-comment-modal-head">
              <h3>Comments</h3>
              <button type="button" onClick={() => setActiveCommentPost(null)}>Close</button>
            </header>
            <article className="ws-feed-row">
              <div className="ws-feed-top">
                <img className="ws-feed-avatar" src={activeCommentPost.avatar} alt={activeCommentPost.author} loading="lazy" />
                <div className="ws-feed-meta">
                  <div className="ws-feed-author-row">
                    <strong>{activeCommentPost.author}</strong>
                    <span>{activeCommentPost.handle}</span>
                  </div>
                </div>
              </div>
              {activeCommentPost.text && <p>{activeCommentPost.text}</p>}
              {activeCommentPost.image && (
                <div className="ws-feed-media">
                  <img src={activeCommentPost.image} alt={`Post by ${activeCommentPost.author}`} loading="lazy" />
                </div>
              )}
              {activeCommentPost.video && (
                <div className="ws-feed-media">
                  <video src={activeCommentPost.video} controls preload="metadata" />
                </div>
              )}
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
          </section>
        </div>
      )}
    </section>
  );
}

export default BookmarksSection;
