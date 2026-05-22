import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Bookmark,
  Ellipsis,
  EyeOff,
  Flag,
  Heart,
  ImagePlus,
  Link2,
  MessageCircle,
  Pencil,
  Repeat2,
  Share2,
  SmilePlus,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { SectionState } from "../WebsiteUI";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { fetchFeedPosts } from "../services/websiteApi";

function formatAge(minutesAgo) {
  if (minutesAgo < 1) return "now";
  if (minutesAgo < 60) return `${minutesAgo}m`;
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}h`;
  return `${Math.floor(minutesAgo / 1440)}d`;
}

function HomeSection({
  displayName,
  username,
  authoredPosts = [],
  onCreatePost,
  repostedPostIds = [],
  onToggleRepost,
  likedPostIds = [],
  onToggleLike,
  bookmarkedPostIds = [],
  onToggleBookmark,
  hiddenPostIds = [],
  blockedHandles = [],
  followedHandles = [],
  onHidePost,
  onBlockHandle,
  onToggleFollowHandle,
  onReportPost,
  onDeletePost,
  onEditPost,
  commentsByPost = {},
  onAddComment,
  composerFocusSignal,
}) {
  const [feedTab, setFeedTab] = useState("for-you");
  const [composerText, setComposerText] = useState("");
  const [composerMediaUrl, setComposerMediaUrl] = useState("");
  const [composerMediaType, setComposerMediaType] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentViewMode, setCommentViewMode] = useState("all");
  const [commentDraft, setCommentDraft] = useState("");
  const [openPostMenuId, setOpenPostMenuId] = useState("");
  const [ageTick, setAgeTick] = useState(0);
  const [sharePost, setSharePost] = useState(null);
  const [activeCommentPostRef, setActiveCommentPostRef] = useState(null);
  const composerInputRef = useRef(null);
  const postRefs = useRef({});
  const { data: posts, isLoading, error } = useAsyncResource(fetchFeedPosts, []);

  useEffect(() => {
    const timer = setInterval(() => setAgeTick((value) => value + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!composerFocusSignal) return;
    setFeedTab("for-you");
    composerInputRef.current?.focus();
    composerInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [composerFocusSignal]);
  useEffect(() => {
    if (!openPostMenuId) return undefined;
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".ws-post-menu-wrap")) {
        setOpenPostMenuId("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openPostMenuId]);

  const allPosts = useMemo(() => [...(authoredPosts || []), ...(posts || [])], [authoredPosts, posts]);
  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPostIds), [bookmarkedPostIds]);
  const repostedSet = useMemo(() => new Set(repostedPostIds), [repostedPostIds]);
  const followedSet = useMemo(() => new Set(followedHandles), [followedHandles]);

  const visiblePosts = useMemo(() => {
    return (allPosts || []).filter((post) => {
      if (feedTab === "following") {
        if (!followedSet?.has(post?.handle) && post?.handle !== `@${username}`) return false;
      }
      if (hiddenPostIds?.includes(post?.id)) return false;
      if (blockedHandles?.includes(post?.handle)) return false;
      return true;
    });
  }, [feedTab, allPosts, hiddenPostIds, blockedHandles, followedSet, username]);

  const handleComposerImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    reader.onload = () => {
      setComposerMediaType(mediaType);
      setComposerMediaUrl(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleComposerSubmit = async () => {
    const trimmedText = composerText.trim();
    if (!trimmedText && !composerMediaUrl) return;
    try {
      await onCreatePost?.({
        text: trimmedText,
        mediaUrl: composerMediaUrl || null,
        mediaType: composerMediaType || "",
        username,
        displayName,
      });
      setComposerText("");
      setComposerMediaUrl("");
      setComposerMediaType("");
    } catch (error) {
      window.alert(error.message || "Unable to create post");
    }
  };

  const handleOpenCommentPopup = (post, mode = "all", postEl = null) => {
    setActiveCommentPost(post);
    setActiveCommentPostRef(postEl);
    setCommentViewMode(mode);
    setCommentDraft("");
  };

  const handleCloseCommentPopup = () => {
    setActiveCommentPost(null);
    setCommentDraft("");
    if (activeCommentPostRef) {
      setTimeout(() => {
        activeCommentPostRef.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  };

  const handleAddComment = () => {
    const nextText = commentDraft.trim();
    if (!activeCommentPost?.id || !nextText) return;
    onAddComment?.(activeCommentPost.id, nextText);
    setCommentDraft("");
  };

  const getCommentCount = (post) => {
    const baseCount = typeof post.stats?.comments === "number" ? post.stats.comments : (post.comments?.length || 0);
    return baseCount + (commentsByPost[post.id]?.length || 0);
  };
  const getViewCount = (post) => {
    if (typeof post.stats?.views === "number") return post.stats.views;
    return (post.stats?.likes || 0) * 45;
  };
  const getCommentsForPost = (post) => {
    const ownComments = commentsByPost[post.id] || [];
    if (commentViewMode === "mine") return ownComments;
    return [...(post.comments || []), ...ownComments];
  };
  const preventPostOpen = (event) => event.stopPropagation();
  const handleCopyPostLink = async (postId) => {
    try {
      const link = `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`;
      await navigator.clipboard.writeText(link);
    } catch {
      // Ignore clipboard write errors in unsupported environments.
    }
    setOpenPostMenuId("");
  };
  const handleEditPost = (post) => {
    const nextText = window.prompt("Edit your post", post.text || "");
    if (nextText === null) return;
    onEditPost?.(post.id, nextText);
    setOpenPostMenuId("");
  };
  const handleDeletePost = (postId) => {
    onDeletePost?.(postId);
    setOpenPostMenuId("");
  };

  const composerCount = composerText.trim().length;

  return (
    <section className="ws-panel ws-x-section ws-home-section">
      <header className="ws-header-row">
        <h1 className="ws-page-title">Home</h1>
      </header>

      <div className="ws-tabbar">
        <button
          type="button"
          className={feedTab === "for-you" ? "active" : ""}
          onClick={() => setFeedTab("for-you")}
        >
          <span className="ws-tab-label">For you</span>
        </button>
        <button
          type="button"
          className={feedTab === "following" ? "active" : ""}
          onClick={() => setFeedTab("following")}
        >
          <span className="ws-tab-label">Following</span>
        </button>
      </div>

      <div className="ws-composer">
        <div className="ws-composer-main">
          <textarea
            ref={composerInputRef}
            className="ws-composer-input"
            placeholder={`What's happening, ${displayName}?`}
            value={composerText}
            onChange={(event) => setComposerText(event.target.value)}
            maxLength={280}
          />
          {composerMediaUrl && (
            <div className="ws-composer-preview">
              {composerMediaType === "video" ? (
                <video src={composerMediaUrl} controls />
              ) : (
                <img src={composerMediaUrl} alt="Selected" />
              )}
              <button
                type="button"
                onClick={() => {
                  setComposerMediaUrl("");
                  setComposerMediaType("");
                }}
              >
                Remove
              </button>
            </div>
          )}
          <div className="ws-composer-tools">
            <button
              type="button"
              className="ws-composer-tool"
              onClick={() => setComposerText((text) => `${text}${text ? " " : ""}😀`)}
              aria-label="Add emoji"
            >
              <SmilePlus size={16} />
            </button>
            <label className="ws-composer-tool" aria-label="Upload image">
              <ImagePlus size={16} />
              <input type="file" accept="image/*,video/*" onChange={handleComposerImage} />
            </label>
            <span className="ws-composer-count">{composerCount}/280</span>
          </div>
        </div>
        <button
          type="button"
          className="ws-post-btn"
          disabled={!composerCount && !composerMediaUrl}
          onClick={handleComposerSubmit}
        >
          Post
        </button>
      </div>

      <div className="ws-feed">
        {isLoading && (
          <div className="ws-feed-skeletons" aria-label="Loading posts">
            {[1, 2, 3].map((item) => (
              <article key={item} className="ws-feed-row ws-feed-skeleton">
                <div className="ws-skeleton ws-skel-head" />
                <div className="ws-skeleton ws-skel-line" />
                <div className="ws-skeleton ws-skel-line short" />
                <div className="ws-skeleton ws-skel-media" />
              </article>
            ))}
          </div>
        )}

        {!isLoading && (
          <SectionState
            isLoading={false}
            error={error}
            isEmpty={!visiblePosts.length}
            emptyText={feedTab === "following" ? "No following posts yet." : "No posts available for this feed."}
          />
        )}

        {!isLoading && !error && !visiblePosts.length && feedTab === "following" && (
          <div className="ws-empty-following">
            <strong>Your Following feed is quiet right now</strong>
            <p>Follow more people to see fresh posts here.</p>
          </div>
        )}

        {visiblePosts.map((post) => (
          <div key={post.id} ref={(el) => { postRefs.current[post.id] = el; }}>
            <article className="ws-feed-row ws-clickable-post" onClick={(e) => handleOpenCommentPopup(post, "all", postRefs.current[post.id])}>
              <div className="ws-feed-top">
                <img className="ws-feed-avatar" src={post.avatar} alt={post.author} loading="lazy" />
                <div className="ws-feed-meta">
                  <div className="ws-feed-author-row">
                    <button 
                      type="button" 
                      className="ws-feed-author-link" 
                      onClick={(event) => {
                        preventPostOpen(event);
                        onToggleFollowHandle?.(post.handle);
                      }}
                    >
                      <strong>{post.author}</strong>
                    </button>
                    {post.verified && (
                      <span className="ws-feed-verified" aria-label="Verified account">
                        <BadgeCheck size={16} />
                      </span>
                    )}
                    <button 
                      type="button" 
                      className="ws-feed-handle-link" 
                      onClick={(event) => {
                        preventPostOpen(event);
                        onToggleFollowHandle?.(post.handle);
                      }}
                    >
                      <span>{post.handle}</span>
                    </button>
                    <span>- {formatAge((post.ageMinutes || 0) + ageTick)}</span>
                  </div>
                </div>
                <div className="ws-post-menu-wrap">
                  <button
                    type="button"
                    className="ws-post-menu-btn"
                    aria-label="Post actions"
                    aria-expanded={openPostMenuId === post.id}
                    onClick={(event) => {
                      preventPostOpen(event);
                      setOpenPostMenuId((prev) => (prev === post.id ? "" : post.id));
                    }}
                  >
                    <Ellipsis size={18} />
                  </button>
                  {openPostMenuId === post.id && (
                    <div className="ws-post-menu" role="menu" aria-label="Post options">
                      {post.handle === `@${username}` ? (
                        <>
                          <button type="button" role="menuitem" onClick={(event) => { preventPostOpen(event); handleEditPost(post); }}>
                            <Pencil size={15} /> Edit post
                          </button>
                          <button type="button" role="menuitem" onClick={(event) => { preventPostOpen(event); handleDeletePost(post.id); }}>
                            <Trash2 size={15} /> Delete post
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" role="menuitem" onClick={(event) => { preventPostOpen(event); onHidePost?.(post.id); setOpenPostMenuId(""); }}>
                            <EyeOff size={15} /> Not interested in this post
                          </button>
                          <button type="button" role="menuitem" onClick={(event) => { preventPostOpen(event); onToggleFollowHandle?.(post.handle); setOpenPostMenuId(""); }}>
                            {followedSet.has(post.handle) ? <UserMinus size={15} /> : <UserPlus size={15} />}
                            {followedSet.has(post.handle) ? "Unfollow" : "Follow"} {post.handle}
                          </button>
                          <button type="button" role="menuitem" onClick={(event) => { preventPostOpen(event); onBlockHandle?.(post.handle); setOpenPostMenuId(""); }}>
                            <Ban size={15} /> Block {post.handle}
                          </button>
                          <button type="button" role="menuitem" onClick={async (event) => { preventPostOpen(event); try { await onReportPost?.(post); } catch (error) { window.alert(error.message || "Unable to report post"); } setOpenPostMenuId(""); }}>
                            <Flag size={15} /> Report post
                          </button>
                        </>
                      )}
                      <button type="button" role="menuitem" onClick={(event) => { preventPostOpen(event); handleCopyPostLink(post.id); }}>
                        <Link2 size={15} /> Copy post link
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p>{post.text}</p>
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
                <button
                  type="button"
                  className="ws-action-btn"
                    onClick={(event) => {
                      preventPostOpen(event);
                    handleOpenCommentPopup(post, "mine", postRefs.current[post.id]);
                  }}
                >
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
                  aria-label={repostedSet.has(post.id) ? "Undo repost" : "Repost"}
                >
                  <Repeat2 size={16} />
                  <span>{(post.stats.reposts || 0) + (repostedSet.has(post.id) ? 1 : 0)}</span>
                </button>
                <button
                  type="button"
                  className={`ws-action-btn ws-like-btn ${likedSet.has(post.id) ? "liked" : ""}`}
                    onClick={(event) => {
                    preventPostOpen(event);
                    onToggleLike?.(post.id);
                  }}
                  aria-label={likedSet.has(post.id) ? "Unlike post" : "Like post"}
                >
                  <Heart size={16} strokeWidth={2} fill={likedSet.has(post.id) ? "currentColor" : "none"} />
                  <span>{post.stats.likes + (likedSet.has(post.id) ? 1 : 0)}</span>
                </button>
                <button
                  type="button"
                  className={`ws-action-btn ${bookmarkedSet.has(post.id) ? "active" : ""}`}
                  onClick={(event) => {
                    preventPostOpen(event);
                    onToggleBookmark?.(post.id);
                  }}
                >
                  <Bookmark size={16} fill={bookmarkedSet.has(post.id) ? "currentColor" : "none"} />
                </button>
                <button type="button" className="ws-action-btn" onClick={(event) => { preventPostOpen(event); setSharePost(post); }}>
                  <Share2 size={16} />
                  <span>{post.stats.shares}</span>
                </button>
              </div>
            </article>
          </div>
        ))}
      </div>

      {activeCommentPost && (
        <div
          className="ws-comment-backdrop"
          role="presentation"
          onClick={handleCloseCommentPopup}
        >
          <div
            className="ws-comment-modal"
            role="dialog"
            aria-label="Post comments"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <header className="ws-comment-modal-header">
              <button type="button" className="ws-comment-close-btn" onClick={handleCloseCommentPopup} aria-label="Close">
                <X size={20} />
              </button>
              <h3>Post</h3>
            </header>

            <div className="ws-comment-modal-body">
              {/* Original Post */}
              <article className="ws-comment-original-post">
                <div className="ws-comment-post-left">
                  <img className="ws-feed-avatar" src={activeCommentPost.avatar} alt={activeCommentPost.author} loading="lazy" />
                  <div className="ws-comment-thread-line" />
                </div>
                <div className="ws-comment-post-content">
                  <div className="ws-feed-author-row">
                    <strong>{activeCommentPost.author}</strong>
                    <span>{activeCommentPost.handle}</span>
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
                  <p className="ws-comment-replying-to">Replying to <span>{activeCommentPost.handle}</span></p>
                </div>
              </article>

              {/* Reply Input */}
              <div className="ws-comment-reply-row">
                <div className="ws-comment-reply-avatar">
                  {displayName?.slice(0, 1).toUpperCase() || "U"}
                </div>
                <div className="ws-comment-reply-field">
                  <textarea
                    className="ws-comment-reply-input"
                    placeholder="Post your reply"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    maxLength={280}
                    rows={3}
                    autoFocus
                  />
                  <div className="ws-comment-reply-actions">
                    <span className="ws-comment-char-count">{commentDraft.length}/280</span>
                    <button
                      type="button"
                      className="ws-comment-reply-btn"
                      onClick={handleAddComment}
                      disabled={!commentDraft.trim()}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="ws-comment-replies-list">
                {getCommentsForPost(activeCommentPost).length > 0 ? (
                  getCommentsForPost(activeCommentPost).map((comment) => (
                    <article key={comment.id} className="ws-comment-reply-item">
                      <div className="ws-comment-reply-item-avatar">
                        {comment.author?.slice(0, 1).toUpperCase() || "U"}
                      </div>
                      <div className="ws-comment-reply-item-body">
                        <div className="ws-comment-reply-item-meta">
                          <strong>{comment.author}</strong>
                          <span>{comment.handle}</span>
                        </div>
                        <p>{comment.text}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="ws-comment-empty">No replies yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {sharePost && (
        <div className="ws-comment-modal-backdrop" role="presentation" onClick={() => setSharePost(null)}>
          <section className="ws-share-modal" role="dialog" aria-label="Share post" onClick={(e) => e.stopPropagation()}>
            <header className="ws-comment-modal-head">
              <h3>Share post</h3>
              <button type="button" onClick={() => setSharePost(null)} aria-label="Close"><X size={20} /></button>
            </header>
            <div className="ws-share-body">
              <p className="ws-share-subtitle">Share to people you follow or via chat</p>
              {followedHandles.length === 0 && (
                <p className="ws-state-msg">Follow people to share posts with them.</p>
              )}
              {followedHandles.map((handle) => (
                <div key={handle} className="ws-share-row">
                  <div className="ws-share-avatar">{handle.slice(1, 2).toUpperCase()}</div>
                  <div className="ws-share-copy">
                    <strong>{handle}</strong>
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

export default HomeSection;
