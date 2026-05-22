import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Ellipsis,
  ImagePlus,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Search,
  Settings,
  SmilePlus,
  User,
  UserRoundPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { SectionState } from "../WebsiteUI";
import { getSocketClient } from "../../../lib/socket";
import { useWebRTCCall } from "../hooks/useWebRTCCall";
import {
  clearConversationHistory,
  deleteConversationById,
  fetchConversationMessages,
  fetchConversations,
  markAllConversationsAsRead,
  markConversationAsRead,
  sendConversationMessage,
  toggleConversationBlockState,
} from "../services/chatApi";

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function ChatSection({ username }) {
  const normalizedUsername = username || "user";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [activeFilter, setActiveFilter] = useState(() => localStorage.getItem(`ws_chat_filter_v1_${normalizedUsername}`) || "all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const menuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  // socketInstance is stored as STATE (not just a ref) so that the WebRTC hook's
  // useEffect dependency fires again once the socket goes from null → live object.
  const [socketInstance, setSocketInstance] = useState(null);
  const myUserId = JSON.parse(localStorage.getItem("user") || "{}").id || "";
  const { callState, startCall, acceptCall, rejectCall, endCall, localVideoRef, remoteVideoRef, remoteAudioRef, localStream, remoteStream } = useWebRTCCall(socketInstance, myUserId);

  const availableContacts = useMemo(() => {
    return contacts.filter((contact) => !contact.deleted);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return availableContacts.filter((contact) => {
      const matchesQuery = !normalizedQuery
        || contact.name.toLowerCase().includes(normalizedQuery)
        || contact.handle.toLowerCase().includes(normalizedQuery)
        || contact.preview.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (activeFilter === "unread") return contact.unread;
      if (activeFilter === "direct") return contact.kind === "direct";
      if (activeFilter === "groups") return contact.kind === "group";
      if (activeFilter === "requests") return false;
      return true;
    });
  }, [activeFilter, availableContacts, searchQuery]);

  const selectedContact = useMemo(
    () => availableContacts.find((contact) => contact.id === selectedContactId) || null,
    [availableContacts, selectedContactId],
  );

  const conversationMessages = useMemo(() => messages, [messages]);

  const blockedContactIds = useMemo(
    () => availableContacts.filter((contact) => contact.blocked).map((contact) => contact.id),
    [availableContacts],
  );

  const refreshContacts = async () => {
    setContactsLoading(true);
    setContactsError("");
    try {
      const nextContacts = await fetchConversations();
      setContacts(nextContacts);
    } catch {
      setContactsError("Could not load data right now.");
    } finally {
      setContactsLoading(false);
    }
  };

  const refreshMessages = async (conversationId) => {
    if (!conversationId) return;
    setMessagesLoading(true);
    setMessagesError("");
    try {
      const nextMessages = await fetchConversationMessages(conversationId);
      setMessages(nextMessages);
    } catch {
      setMessagesError("Could not load data right now.");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    refreshContacts();
  }, []);

  useEffect(() => {
    if (availableContacts.length && !selectedContactId) {
      setSelectedContactId(availableContacts[0].id);
    }
  }, [availableContacts, selectedContactId]);

  useEffect(() => {
    if (!filteredContacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(filteredContacts[0]?.id || availableContacts[0]?.id || "");
    }
  }, [filteredContacts, availableContacts, selectedContactId]);

  useEffect(() => {
    if (!selectedContactId) return;
    markConversationAsRead(selectedContactId).catch(() => {});
    setContacts((prev) => prev.map((contact) => (
      contact.id === selectedContactId ? { ...contact, unread: false } : contact
    )));
    refreshMessages(selectedContactId);
  }, [selectedContactId]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuOpen && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
      if (filterMenuOpen && !filterMenuRef.current?.contains(event.target)) {
        setFilterMenuOpen(false);
      }
      if (emojiMenuOpen && !emojiMenuRef.current?.contains(event.target)) {
        setEmojiMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [emojiMenuOpen, filterMenuOpen, menuOpen]);

  useEffect(() => {
    localStorage.setItem(`ws_chat_filter_v1_${normalizedUsername}`, activeFilter);
  }, [activeFilter, normalizedUsername]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = setTimeout(() => setStatusMessage(""), 2200);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const tokenUser = JSON.parse(localStorage.getItem("user") || "{}");
    const socket = getSocketClient();
    socket.auth = { userId: tokenUser.id || "" };
    if (!socket.connected) {
      socket.connect();
    }
    socketRef.current = socket;
    // Store as state so the WebRTC hook's listener effect re-runs with the live socket
    setSocketInstance(socket);

    return () => {
      socket.disconnect();
      setSocketInstance(null);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedContactId) return undefined;

    socket.emit("chat:join", selectedContactId);
    const handleIncomingMessage = (payload) => {
      if (payload.conversationId !== selectedContactId) return;
      
      // If the message is from 'me', we likely already added it via the API response
      // unless it's a different tab/device. The .some check handles this.
      setMessages((prev) => {
        const isDuplicate = prev.some((item) => String(item.id) === String(payload.message.id));
        if (isDuplicate) return prev;
        return [...prev, payload.message];
      });

      setContacts((prev) => prev.map((contact) => (
        contact.id === selectedContactId
          ? { ...contact, preview: payload.message.text || "New attachment", time: "Now" }
          : contact
      )));
    };

    socket.on("chat:message", handleIncomingMessage);
    return () => {
      socket.off("chat:message", handleIncomingMessage);
      socket.emit("chat:leave", selectedContactId);
    };
  }, [selectedContactId]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          handleSendVoiceMessage(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      window.alert("Microphone access denied or not available");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleSendVoiceMessage = async (base64Audio) => {
    if (!selectedContact?.id) return;
    try {
      const message = await sendConversationMessage(selectedContact.id, {
        text: "Voice message",
        mediaUrl: base64Audio,
        mediaType: "audio",
      });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      window.alert("Failed to send voice message");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    const text = draftMessage.trim();
    if (!text && !attachmentPreview) return;
    const message = await sendConversationMessage(selectedContact.id, {
      text,
      mediaUrl: attachmentPreview?.url || "",
      mediaType: attachmentPreview?.type || "",
    });
    setMessages((prev) => {
      const isDuplicate = prev.some((item) => String(item.id) === String(message.id));
      if (isDuplicate) return prev;
      return [...prev, message];
    });
    setContacts((prev) => prev.map((contact) => (
      contact.id === selectedContact.id
        ? { ...contact, preview: text || (attachmentPreview?.type === "video" ? "Sent a video" : "Sent an image"), time: "Now" }
        : contact
    )));
    setDraftMessage("");
    setAttachmentPreview(null);
  };

  const handleClearChat = async () => {
    if (!selectedContact) return;
    await clearConversationHistory(selectedContact.id);
    setMessages([]);
    setContacts((prev) => prev.map((contact) => (
      contact.id === selectedContact.id ? { ...contact, preview: "Chat cleared", time: "Now" } : contact
    )));
    setMenuOpen(false);
    setStatusMessage("Chat cleared");
  };

  const handleDeleteChat = async () => {
    if (!selectedContact) return;
    await deleteConversationById(selectedContact.id);
    setContacts((prev) => prev.filter((contact) => contact.id !== selectedContact.id));
    setMessages([]);
    setMenuOpen(false);
    setStatusMessage("Chat deleted");
  };

  const handleBlockContact = async () => {
    if (!selectedContact) return;
    const response = await toggleConversationBlockState(selectedContact.id);
    const handle = selectedContact.handle || `@${selectedContact.name.toLowerCase().replace(/\s+/g, "")}`;
    setContacts((prev) => prev.map((contact) => (
      contact.id === selectedContact.id ? { ...contact, blocked: response.blocked } : contact
    )));
    if (!response.blocked) {
      setStatusMessage(`${selectedContact.name} unblocked`);
      // Sync to Settings blocked accounts
      try {
        const existing = JSON.parse(localStorage.getItem("gs_blocked_accounts_v1") || "[]");
        localStorage.setItem("gs_blocked_accounts_v1", JSON.stringify(existing.filter((h) => h !== handle)));
      } catch { /* ignore */ }
    } else {
      setStatusMessage(`You blocked ${selectedContact.name}. Tap to unblock.`);
      // Sync to Settings blocked accounts
      try {
        const existing = JSON.parse(localStorage.getItem("gs_blocked_accounts_v1") || "[]");
        if (!existing.includes(handle)) {
          localStorage.setItem("gs_blocked_accounts_v1", JSON.stringify([...existing, handle]));
        }
      } catch { /* ignore */ }
    }
    setMenuOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllConversationsAsRead();
    setContacts((prev) => prev.map((contact) => ({ ...contact, unread: false })));
    setFilterMenuOpen(false);
    setStatusMessage("All chats marked as read");
  };

  const handleCallAction = async (kind) => {
    if (!selectedContact) return;
    const displayName = localStorage.getItem("displayName") || username;
    const remoteId = selectedContact.userId || selectedContact.id;
    if (!remoteId) {
      setStatusMessage("Cannot call: user ID not found");
      return;
    }
    try {
      await startCall({
        remoteUserId: remoteId,
        remoteName: selectedContact.name,
        callType: kind,
        myName: displayName,
      });
    } catch {
      setStatusMessage(`Could not access ${kind === "video" ? "camera/microphone" : "microphone"}. Please check permissions.`);
    }
  };

  const handleAcceptCall = async () => {
    if (!callState) return;
    // Immediately flip UI to "active" so it doesn't appear stuck
    // (the real connection may take a moment to establish)
    const { remoteUserId, incomingOffer, callType } = callState;
    try {
      await acceptCall({ fromUserId: remoteUserId, offer: incomingOffer, callType });
    } catch (err) {
      console.error("Accept call failed:", err);
      // If it truly can't start (e.g. no mic), bail and show reason
      const reason = err?.name === "NotReadableError" || err?.name === "NotAllowedError"
        ? "Camera/microphone is unavailable. Ensure permissions are granted."
        : "Could not start call. Please try again.";
      setStatusMessage(reason);
      // Reset call state so the modal closes
      rejectCall({ fromUserId: remoteUserId });
    }
  };

  const handleToggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    setIsMuted((prev) => !prev);
  };

  const handleToggleCam = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => { t.enabled = isCamOff; });
    setIsCamOff((prev) => !prev);
  };

  const handleProfileAction = () => {
    if (!selectedContact) return;
    setStatusMessage(`Viewing ${selectedContact.name} profile`);
  };

  const handleAttachFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    reader.onload = () => {
      setAttachmentPreview({
        url: String(reader.result || ""),
        type: mediaType,
        name: file.name,
      });
      setStatusMessage(`${mediaType === "video" ? "Video" : "Image"} attached`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleVoiceNote = async () => {
    if (!selectedContact) return;
    const message = await sendConversationMessage(selectedContact.id, {
      text: "Voice message",
      mediaUrl: "",
      mediaType: "",
    });
    setMessages((prev) => [...prev, message]);
    setStatusMessage("Voice note sent");
  };

  const filterItems = [
    { id: "all", label: "All", Icon: MessageCircle },
    { id: "unread", label: "Unread", Icon: CircleUserRound },
    { id: "direct", label: "Direct", Icon: User },
    { id: "groups", label: "Groups", Icon: Users },
  ];

  const emojiChoices = ["😀", "🔥", "👍", "👏", "😂", "💬"];

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  const callStatusLabel = {
    calling: "Calling…",
    incoming: "Incoming call",
    active: remoteStream ? "Connected" : "Connecting…",
    ended: "Call ended",
  };

  // Safety net: if srcObject is set but video hasn't started, call play() on canplay
  const handleRemoteCanPlay = (e) => { e.target.play().catch(() => {}); };
  const handleLocalCanPlay  = (e) => { e.target.play().catch(() => {}); };

  return (
    <section className="ws-chat-page ws-chat-page-modern">
      {/* ── WebRTC Call Modal ──────────────────────────────────────────────── */}
      {callState && callState.status !== "idle" && (
        <div className="ws-call-overlay">
          <div className="ws-call-modal">
            {/* Remote video (background – video calls) */}
            <video
              ref={remoteVideoRef}
              className="ws-call-remote-video"
              autoPlay
              playsInline
              onCanPlay={handleRemoteCanPlay}
            />
            {/* Remote audio element for audio-only calls */}
            <audio
              ref={remoteAudioRef}
              autoPlay
              onCanPlay={handleRemoteCanPlay}
              style={{ position: "absolute", width: 0, height: 0 }}
            />
            {/* Local preview */}
            {callState.callType === "video" ? (
              <video
                ref={localVideoRef}
                className="ws-call-local-video"
                autoPlay
                playsInline
                muted
                onCanPlay={handleLocalCanPlay}
              />
            ) : (
              <audio autoPlay muted style={{ display: "none" }} />
            )}

            {/* Call info */}
            <div className="ws-call-info">
              <div className="ws-call-avatar">{(callState.remoteName || "?")[0].toUpperCase()}</div>
              <p className="ws-call-name">{callState.remoteName || "Unknown"}</p>
              <p className="ws-call-status">{callStatusLabel[callState.status] || callState.status}</p>
            </div>

            {/* Incoming call: Accept / Reject */}
            {callState.status === "incoming" && (
              <div className="ws-call-actions">
                <button
                  type="button"
                  className="ws-call-btn ws-call-btn-accept"
                  aria-label="Accept call"
                  onClick={handleAcceptCall}
                >
                  <Phone size={26} />
                </button>
                <button
                  type="button"
                  className="ws-call-btn ws-call-btn-reject"
                  aria-label="Reject call"
                  onClick={() => rejectCall({ fromUserId: callState.remoteUserId })}
                >
                  <PhoneOff size={26} />
                </button>
              </div>
            )}

            {/* Active/calling: mute, cam, end */}
            {(callState.status === "calling" || callState.status === "active") && (
              <div className="ws-call-actions">
                <button
                  type="button"
                  className={`ws-call-btn ws-call-btn-mute ${isMuted ? "active" : ""}`}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  onClick={handleToggleMute}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                {callState.callType === "video" && (
                  <button
                    type="button"
                    className={`ws-call-btn ws-call-btn-cam ${isCamOff ? "active" : ""}`}
                    aria-label={isCamOff ? "Turn camera on" : "Turn camera off"}
                    onClick={handleToggleCam}
                  >
                    {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
                  </button>
                )}
                <button
                  type="button"
                  className="ws-call-btn ws-call-btn-end"
                  aria-label="End call"
                  onClick={() => endCall(callState.remoteUserId)}
                >
                  <PhoneOff size={26} />
                </button>
              </div>
            )}

            {callState.status === "ended" && (
              <div className="ws-call-ended-msg">Call ended</div>
            )}
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <aside className="ws-chat-left ws-chat-left-modern">
        <div className="ws-chat-left-head">
          <h1 className="ws-chat-screen-title">Chat</h1>
          <div className="ws-chat-filter-wrap" ref={filterMenuRef}>
            <button
              type="button"
              className="ws-chat-filter-btn"
              aria-expanded={filterMenuOpen}
              onClick={() => setFilterMenuOpen((prev) => !prev)}
            >
              <span>{filterItems.find((item) => item.id === activeFilter)?.label || "All"}</span>
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              className="ws-chat-filter-icon"
              aria-label="Mark all chats read"
              onClick={handleMarkAllRead}
            >
              <Check size={17} />
            </button>
            {filterMenuOpen && (
              <div className="ws-chat-filter-menu" role="menu" aria-label="Chat filter menu">
                {filterItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={activeFilter === id ? "active" : ""}
                    onClick={() => {
                      setActiveFilter(id);
                      setFilterMenuOpen(false);
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
                <span className="ws-chat-filter-sep" />
                <button type="button" onClick={() => { setFilterMenuOpen(false); setStatusMessage("Requests opened"); }}>
                  <UserRoundPlus size={18} />
                  <span>Requests</span>
                  <ChevronRight size={16} className="ws-chat-filter-arrow" />
                </button>
                <button type="button" onClick={() => { setFilterMenuOpen(false); setStatusMessage("Chat settings opened"); }}>
                  <Settings size={18} />
                  <span>Settings</span>
                  <ChevronRight size={16} className="ws-chat-filter-arrow" />
                </button>
                <span className="ws-chat-filter-sep" />
                <button type="button" onClick={handleMarkAllRead}>
                  <Check size={18} />
                  <span>Mark all as read</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ws-chat-left-search">
          <div className="ws-chat-search-container">
            <Search size={18} className="ws-chat-search-icon" />
            <input
              className="ws-chat-search-input"
              type="search"
              placeholder="Search"
              aria-label="Search chat"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <SectionState
          isLoading={contactsLoading}
          error={contactsError}
          isEmpty={!filteredContacts.length}
          emptyText="No conversations in this filter."
        />

        <div className="ws-chat-list ws-chat-list-modern">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className={`ws-chat-contact ws-chat-contact-modern ${selectedContactId === contact.id ? "active" : ""}`}
              onClick={() => setSelectedContactId(contact.id)}
            >
              <div className="ws-chat-contact-avatar" aria-hidden="true">{getInitials(contact.name)}</div>
              <div className="ws-chat-contact-copy">
                <strong>{contact.name}</strong>
                <span>{contact.preview}</span>
              </div>
              <div className="ws-chat-contact-meta">
                <small>{contact.time}</small>
                {contact.unread && <span className="ws-chat-unread-dot" aria-label="Unread chat" />}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="ws-chat-right ws-chat-right-modern">
        <header className="ws-chat-header ws-chat-header-modern">
          <div className="ws-chat-current-user">
            <div className="ws-chat-current-avatar" aria-hidden="true">
              {selectedContact ? getInitials(selectedContact.name) : getInitials(username)}
            </div>
            <div className="ws-chat-current-copy">
              <strong>{selectedContact ? selectedContact.name : username}</strong>
            </div>
          </div>

          <div className="ws-chat-header-actions ws-chat-header-actions-modern">
            <button type="button" className="ws-chat-icon-btn ws-chat-icon-btn-modern" aria-label="Audio call" disabled={!selectedContact} onClick={() => handleCallAction("audio")}>
              <Phone size={18} />
            </button>
            <button type="button" className="ws-chat-icon-btn ws-chat-icon-btn-modern" aria-label="Video call" disabled={!selectedContact} onClick={() => handleCallAction("video")}>
              <Video size={18} />
            </button>
            <div className="ws-chat-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="ws-chat-icon-btn ws-chat-icon-btn-modern"
                aria-label="Chat options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
                disabled={!selectedContact}
              >
                <Ellipsis size={20} />
              </button>
              {menuOpen && selectedContact && (
                <div className="ws-chat-menu ws-chat-menu-modern" role="menu" aria-label="Chat actions">
                  <button type="button" role="menuitem" onClick={handleDeleteChat}>Delete chat</button>
                  <button type="button" role="menuitem" onClick={handleClearChat}>Clear chat</button>
                  <button type="button" role="menuitem" onClick={handleBlockContact}>
                    {blockedContactIds.includes(selectedContact.id) ? "Unblock" : "Block"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="ws-chat-body ws-chat-body-modern">
          <SectionState
            isLoading={messagesLoading}
            error={messagesError}
            isEmpty={!selectedContact}
            emptyText="Select a conversation."
          />

          {selectedContact && (
            <>
              <div className="ws-message-stack ws-message-stack-modern">
                <div className="ws-chat-profile-card">
                  <div className="ws-chat-profile-avatar" aria-hidden="true">{getInitials(selectedContact.name)}</div>
                  <strong>{selectedContact.name}</strong>
                  <span>{selectedContact.handle}</span>
                  <button type="button" className="ws-chat-profile-btn" onClick={handleProfileAction}>View Profile</button>
                </div>

                <p className="ws-chat-encryption-note">This conversation is now end-to-end encrypted</p>

                {conversationMessages.map((message, index, arr) => {
                  const msgDate = "Today";
                  const prevMsgDate = index > 0 ? "Today" : null;
                  const showDate = msgDate !== prevMsgDate;

                  return (
                    <Fragment key={message.id}>
                      {showDate && <div className="ws-chat-date-pill">{msgDate}</div>}
                      <div className={`ws-message-row ${message.from === "me" ? "me" : "them"}`}>
                        {message.mediaUrl && (
                          <div className="ws-media-container">
                            {message.mediaType === "image" ? (
                              <img className="ws-chat-media-bubble" src={message.mediaUrl} alt="Sent attachment" />
                            ) : message.mediaType === "video" ? (
                              <video className="ws-chat-media-bubble" src={message.mediaUrl} controls preload="metadata" />
                            ) : (
                              <div className="ws-chat-audio-bubble">
                                <Volume2 size={16} />
                                <audio src={message.mediaUrl} controls />
                              </div>
                            )}
                            {!message.text && <small className="ws-media-time">{message.time}</small>}
                          </div>
                        )}
                        {message.text && (
                          <span className={`ws-message-bubble ${message.from === "me" ? "ws-message-bubble-sent" : "ws-message-bubble-recv"}`}>
                            <span>{message.text}</span>
                            <small>{message.time}</small>
                          </span>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </>
          )}

          {selectedContact && blockedContactIds.includes(selectedContact.id) && (
            <div className="ws-chat-blocked-banner">
              <span>You blocked {selectedContact.name}. Tap to unblock.</span>
              <button type="button" onClick={handleBlockContact}>Unblock</button>
            </div>
          )}

          {statusMessage && <div className="ws-chat-status-banner">{statusMessage}</div>}

          <div className="ws-chat-compose ws-chat-compose-modern">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleAttachFile} />
            <button type="button" className="ws-chat-compose-circle" aria-label="Add attachment" onClick={() => fileInputRef.current?.click()} disabled={!selectedContact}>
              <ImagePlus size={18} />
            </button>
            <div className="ws-chat-emoji-wrap" ref={emojiMenuRef}>
              <button type="button" className="ws-chat-compose-circle" aria-label="Add emoji" onClick={() => setEmojiMenuOpen((prev) => !prev)} disabled={!selectedContact}>
                <SmilePlus size={18} />
              </button>
              {emojiMenuOpen && (
                <div className="ws-chat-emoji-menu">
                  {emojiChoices.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setDraftMessage((prev) => `${prev}${emoji}`);
                        setEmojiMenuOpen(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isRecording ? (
              <div className="ws-chat-recording-bar">
                <span className="ws-recording-dot" />
                <span>Recording... {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}</span>
                <button type="button" className="ws-stop-btn" onClick={stopRecording}>Stop & Send</button>
              </div>
            ) : (
              <>
                <div className="ws-chat-compose-field">
                  {attachmentPreview && (
                    <div className="ws-chat-attach-chip">
                      <span>{attachmentPreview.name}</span>
                      <button type="button" onClick={() => setAttachmentPreview(null)}>Remove</button>
                    </div>
                  )}
                  <input
                    type="text"
                    className="ws-chat-compose-input ws-chat-compose-input-modern"
                    placeholder={selectedContact ? "Message" : "Select a conversation first"}
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSendMessage();
                    }}
                    disabled={!selectedContact}
                  />
                  <button type="button" className="ws-chat-compose-mic" aria-label="Start recording" onClick={startRecording} disabled={!selectedContact}>
                    <Mic size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  className="ws-chat-send-btn ws-chat-send-btn-modern"
                  onClick={handleSendMessage}
                  disabled={!selectedContact || (!draftMessage.trim() && !attachmentPreview) || (selectedContact && blockedContactIds.includes(selectedContact.id))}
                >
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

export default ChatSection;
