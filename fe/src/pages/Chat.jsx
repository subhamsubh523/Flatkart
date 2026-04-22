import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import EmojiPicker from "emoji-picker-react";
import { FiPaperclip, FiX, FiImage, FiSmile, FiPhone, FiMail } from "react-icons/fi";

const socket = io("http://localhost:5000", { autoConnect: true });
const avatarSrc = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `http://localhost:5000/uploads/${avatar}`;
};

function Avatar({ avatar, name, style, bgColor }) {
  const src = avatarSrc(avatar);
  return src
    ? <img src={src} alt={name} style={{ ...style, objectFit: "cover" }} />
    : <div style={{ ...style, background: bgColor || "#1abc9c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: style?.width ? `${parseInt(style.width) * 0.4}px` : "1rem" }}>{name?.[0]?.toUpperCase()}</div>;
}

export default function Chat() {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(userId || null);
  const [activeName, setActiveName] = useState(location.state?.name || "");
  const [activeAvatar, setActiveAvatar] = useState(location.state?.avatar || "");
  const [activePhone, setActivePhone] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // { dataUrl, file }
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [phoneClosing, setPhoneClosing] = useState(false);

  const closePhone = () => {
    setPhoneClosing(true);
    setTimeout(() => { setShowPhone(false); setPhoneClosing(false); }, 160);
  };
  const emojiRef = useRef(null);
  const [formatting, setFormatting] = useState({ bold: false, italic: false, underline: false });
  const fileInputRef = useRef(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const activeIdRef = useRef(activeId);

  const nameCache = useRef({});
  const avatarCache = useRef({});

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const fetchConversations = useCallback(() => {
    API.get("/chat/conversations")
      .then(({ data }) => {
        setConversations(data);
        setLoadingConvs(false);
        data.forEach((c) => {
          nameCache.current[c.userId] = c.name;
          if (c.avatar) avatarCache.current[c.userId] = c.avatar;
          if (c.phone) avatarCache.current[c.userId + "_phone"] = c.phone;
          if (c.email) avatarCache.current[c.userId + "_email"] = c.email;
        });
      })
      .catch(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    socket.emit("join", user.id);
    socket.emit("get_online_users");
  }, [user]);

  useEffect(() => {
    const onOnline = (uid) => setOnlineUsers((prev) => new Set([...prev, uid]));
    const onOffline = (uid) => setOnlineUsers((prev) => { const s = new Set(prev); s.delete(uid); return s; });
    const onOnlineList = (list) => setOnlineUsers(new Set(list));
    socket.on("user_online", onOnline);
    socket.on("user_offline", onOffline);
    socket.on("online_users", onOnlineList);
    return () => {
      socket.off("user_online", onOnline);
      socket.off("user_offline", onOffline);
      socket.off("online_users", onOnlineList);
    };
  }, []);

  useEffect(() => {
    const onMessage = (msg) => {
      const senderId = msg.sender_id?.toString();
      const receiverId = msg.receiver_id?.toString();
      const current = activeIdRef.current;
      if (senderId === current || receiverId === current) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        if (senderId === current) {
          API.patch(`/chat/read/${current}`).catch(() => {});
          setConversations((prev) => prev.map((c) => c.userId === current ? { ...c, unread: 0 } : c));
        }
      }
      fetchConversations();
    };
    const onNewConv = () => fetchConversations();
    socket.on("receive_message", onMessage);
    socket.on("new_conversation", onNewConv);
    return () => {
      socket.off("receive_message", onMessage);
      socket.off("new_conversation", onNewConv);
    };
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (userId) setActiveId(userId);
  }, [userId]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    setMessages([]);

    API.get(`/chat/messages/${activeId}`)
      .then(({ data }) => {
        setMessages(data);
        setLoadingMsgs(false);
        API.patch(`/chat/read/${activeId}`).catch(() => {});
      })
      .catch(() => setLoadingMsgs(false));

    // Always fetch fresh contact info for the active user
    API.get(`/chat/user/${activeId}`)
      .then(({ data }) => {
        avatarCache.current[activeId + "_phone"] = data.phone || "";
        avatarCache.current[activeId + "_email"] = data.email || "";
        setActivePhone(data.phone || "");
        setActiveEmail(data.email || "");
      })
      .catch(() => {});

    if (nameCache.current[activeId]) {
      setActiveName(nameCache.current[activeId]);
      setActiveAvatar(avatarCache.current[activeId] || "");
      setActivePhone(avatarCache.current[activeId + "_phone"] || "");
      setActiveEmail(avatarCache.current[activeId + "_email"] || "");
    } else {
      const conv = conversations.find((c) => c.userId === activeId);
      if (conv) {
        nameCache.current[activeId] = conv.name;
        if (conv.avatar) avatarCache.current[activeId] = conv.avatar;
        setActiveName(conv.name);
        setActiveAvatar(conv.avatar || "");
        setActivePhone(conv.phone || "");
        setActiveEmail(conv.email || "");
      } else {
        const stateNameForThisId = location.state?.name && userId === activeId ? location.state.name : null;
        if (stateNameForThisId) {
          nameCache.current[activeId] = stateNameForThisId;
          setActiveName(stateNameForThisId);
          setActiveAvatar(location.state?.avatar || "");
        } else {
          setActiveName("");
          setActiveAvatar("");
          setActivePhone("");
          setActiveEmail("");
          API.get(`/chat/user/${activeId}`)
            .then(({ data }) => {
              nameCache.current[activeId] = data.name || "";
              avatarCache.current[activeId] = data.avatar || "";
              avatarCache.current[activeId + "_phone"] = data.phone || "";
              avatarCache.current[activeId + "_email"] = data.email || "";
              setActiveName(data.name || "");
              setActiveAvatar(data.avatar || "");
              setActivePhone(data.phone || "");
              setActiveEmail(data.email || "");
            })
            .catch(() => {});
        }
      }
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.userId === activeId);
    if (conv) {
      nameCache.current[conv.userId] = conv.name;
      if (conv.avatar) avatarCache.current[conv.userId] = conv.avatar;
      if (!activeName) setActiveName(conv.name);
      if (!activeAvatar) setActiveAvatar(conv.avatar || "");
    }
  }, [conversations, activeId]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const html = inputRef.current?.innerHTML?.trim();
    const hasText = html && html !== "<br>";
    const hasImage = !!imagePreview;
    if ((!hasText && !hasImage) || !activeId) return;

    const textToRestore = hasText ? html : "";
    if (inputRef.current) inputRef.current.innerHTML = "";
    setText("");
    setImagePreview(null);

    try {
      let finalHtml = hasText ? html : "";

      if (hasImage) {
        let imageUrl;
        if (imagePreview.uploaded && imagePreview.url) {
          imageUrl = imagePreview.url;
        } else {
          const blob = await fetch(imagePreview.dataUrl).then((r) => r.blob());
          const formData = new FormData();
          formData.append("image", blob, "chat-image.jpg");
          const { data: uploadData } = await API.post("/chat/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
          imageUrl = uploadData.url;
        }
        finalHtml += `<img src="${imageUrl}" style="max-width:260px;max-height:200px;border-radius:10px;display:block;margin-top:${hasText ? "8px" : "0"}" />`;
      }

      const { data: msg } = await API.post("/chat", { receiver_id: activeId, text: finalHtml });
      setMessages((prev) => [...prev, msg]);
      socket.emit("send_message", { receiver_id: activeId, message: msg });
      fetchConversations();
    } catch {
      if (inputRef.current) inputRef.current.innerHTML = textToRestore;
    }
  };

  const handleLightboxUpload = async () => {
    if (!imagePreview?.dataUrl || uploadingImage) return;
    setUploadingImage(true);
    try {
      const blob = await fetch(imagePreview.dataUrl).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "chat-image.jpg");
      const { data } = await API.post("/chat/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setImagePreview({ dataUrl: data.url, name: imagePreview.name, uploaded: true, url: data.url });
      setLightboxSrc(null);
    } catch {
      // keep preview as-is on failure
    } finally {
      setUploadingImage(false);
    }
  };

  const phoneRef = useRef(null);

  useEffect(() => {
    if (!showPhone) return;
    const handler = (e) => { if (phoneRef.current && !phoneRef.current.contains(e.target)) closePhone(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPhone]);

  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  const onEmojiClick = (emojiData) => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(emojiData.emoji));
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.innerText += emojiData.emoji;
    }
    setText(el.innerText);
  };

  const handleImageAttach = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview({ dataUrl: ev.target.result, name: file.name });
      setLightboxSrc(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyFormat = (cmd) => {
    inputRef.current?.focus();
    document.execCommand(cmd, false, null);
    setFormatting({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline") });
  };

  const handleInput = () => {
    setText(inputRef.current?.innerText || "");
    setFormatting({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline") });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectConv = (conv) => {
    nameCache.current[conv.userId] = conv.name;
    if (conv.avatar) avatarCache.current[conv.userId] = conv.avatar;
    if (conv.phone) avatarCache.current[conv.userId + "_phone"] = conv.phone;
    if (conv.email) avatarCache.current[conv.userId + "_email"] = conv.email;
    setActiveId(conv.userId);
    setActiveName(conv.name);
    setActiveAvatar(conv.avatar || "");
    setActivePhone(conv.phone || "");
    setActiveEmail(conv.email || "");
    setConversations((prev) => prev.map((c) => c.userId === conv.userId ? { ...c, unread: 0 } : c));
    navigate(`/chat/${conv.userId}`, { replace: true });
  };

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const stripHtml = (html) => html?.replace(/<[^>]*>/g, "").replace(/&lt;.*?&gt;/g, "").trim();
  const isMine = (m) => m.sender_id?.toString() === user?.id;

  return (
    <div style={styles.page}>
      <style>{`[data-placeholder]:empty:before{content:attr(data-placeholder);color:#aab;pointer-events:none} .bubble-text img{cursor:zoom-in} @keyframes popupIn{from{opacity:0;transform:scale(0.9) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes popupOut{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(0.9) translateY(-6px)}}`}</style>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Messages ({conversations.length})</span>
          {conversations.reduce((sum, c) => sum + (c.unread || 0), 0) > 0 && (
            <span style={styles.sidebarCount}>{conversations.reduce((sum, c) => sum + (c.unread || 0), 0)} unread</span>
          )}
        </div>
        <div style={styles.sidebarList}>
          {loadingConvs ? (
            <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div style={styles.noConv}>
              <span style={{ fontSize: "2rem" }}>🗨️</span>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#8a9bb0" }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeId === c.userId;
              return (
                <div key={c.userId} onClick={() => selectConv(c)} style={{ ...styles.convItem, ...(isActive ? styles.convItemActive : {}) }}>
                  <div style={styles.convAvatarWrap}>
                    <Avatar avatar={c.avatar} name={c.name} style={styles.convAvatar} bgColor="#1abc9c" />
                    {onlineUsers.has(c.userId) && <span style={styles.onlineDot} />}
                  </div>
                  <div style={styles.convInfo}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={styles.convName}>{c.name}</p>
                      {c.unread > 0 && <span style={styles.unreadBadge}>{c.unread}</span>}
                    </div>
                    <p style={{ ...styles.convLast, fontWeight: c.unread > 0 ? "600" : "400", color: c.unread > 0 ? "#c8d6e5" : "#8a9bb0" }}>
                      {c.lastMessage?.includes("<img") ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FiImage size={12} /> Photo</span>
                      ) : (
                        <>{stripHtml(c.lastMessage)?.slice(0, 30)}{stripHtml(c.lastMessage)?.length > 30 ? "…" : ""}</>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div style={styles.chatPanel}>
        {!activeId ? (
          <div style={styles.noChat}>
            <div style={styles.noChatIconWrap}>💬</div>
            <p style={styles.noChatTitle}>Your Messages</p>
            <p style={styles.noChatSub}>Select a conversation from the left to start chatting</p>
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <Avatar avatar={activeAvatar} name={activeName} style={styles.chatHeaderAvatar} bgColor="#1abc9c" />
                <div>
                  <p style={styles.chatHeaderName}>{activeName || "..."}</p>
                  <p style={{ ...styles.chatHeaderStatus, color: onlineUsers.has(activeId) ? "#2ecc71" : "#e74c3c" }}>
                    {onlineUsers.has(activeId) ? "● Online" : "● Offline"}
                  </p>
                </div>
              </div>
              {(activePhone || activeEmail) && (
                <div ref={phoneRef} style={{ position: "relative" }}>
                  <button style={styles.infoBtn} onClick={() => showPhone ? closePhone() : setShowPhone(true)} title="Contact Info">
                    <span style={{ fontWeight: "700", fontSize: "15px", fontStyle: "italic", fontFamily: "Georgia, serif", lineHeight: 1 }}>i</span>
                  </button>
                  {showPhone && (
                    <div style={{ ...styles.phonePopup, animation: phoneClosing ? "popupOut 0.16s ease forwards" : "popupIn 0.18s ease forwards" }}>
                      <p style={styles.popupTitle}>Contact Info</p>
                      {activePhone && (
                        <div style={styles.popupRow}>
                          <FiPhone size={13} color="#1abc9c" />
                          <a href={`tel:${activePhone}`} style={styles.phoneLink}>{activePhone}</a>
                        </div>
                      )}
                      {activeEmail && (
                        <div style={styles.popupRow}>
                          <FiMail size={13} color="#1abc9c" />
                          <a href={`mailto:${activeEmail}`} style={styles.phoneLink}>{activeEmail}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.messages} ref={messagesRef}>
              {loadingMsgs ? (
                <div style={{ margin: "auto" }}><Spinner /></div>
              ) : messages.length === 0 ? (
                <div style={styles.noMessages}>
                  <span style={{ fontSize: "2.5rem" }}>👋</span>
                  <p style={{ margin: "8px 0 0", color: "#aab" }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const mine = isMine(m);
                  return (
                    <div key={m._id || i} style={{ ...styles.msgRow, justifyContent: mine ? "flex-end" : "flex-start" }}>
                      {!mine && <Avatar avatar={activeAvatar} name={activeName} style={styles.msgAvatar} bgColor="#1abc9c" />}
                      <div style={{ ...styles.bubble, ...(mine ? styles.bubbleMine : styles.bubbleTheirs) }}>
                        <p className="bubble-text" style={styles.bubbleText} dangerouslySetInnerHTML={{ __html: m.text }} onClick={(e) => { if (e.target.tagName === "IMG") setLightboxSrc(e.target.src); }} />
                        <span style={{ ...styles.bubbleTime, color: mine ? "rgba(255,255,255,0.5)" : "#b0bec5" }}>{fmt(m.createdAt)}</span>
                      </div>
                      {mine && <Avatar avatar={user?.avatar} name={user?.name} style={styles.msgAvatar} bgColor="#2c3e50" />}
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

              <div style={styles.inputArea}>
              <div style={styles.fmtBar}>
                {[{cmd:"bold",label:"B",extra:{fontWeight:"700"}},{cmd:"italic",label:"I",extra:{fontStyle:"italic"}},{cmd:"underline",label:"U",extra:{textDecoration:"underline"}}].map(({cmd,label,extra}) => (
                  <button key={cmd} type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyFormat(cmd); }}
                    style={{ ...styles.fmtBtn, ...extra, ...(formatting[cmd] ? styles.fmtBtnActive : {}) }}>
                    {label}
                  </button>
                ))}
              </div>
              {imagePreview && (
                <div style={styles.imagePreviewWrap}>
                  <img src={imagePreview.dataUrl} alt="preview" style={{ ...styles.imagePreviewImg, cursor: "zoom-in" }} onClick={() => setLightboxSrc(imagePreview.dataUrl)} />
                  <button style={styles.imagePreviewRemove} onClick={() => setImagePreview(null)}><FiX size={12} /></button>
                </div>
              )}
              <div style={styles.inputRow}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageAttach} />
                <button type="button" style={styles.attachBtn} onClick={() => fileInputRef.current?.click()} title="Attach image">
                  <FiPaperclip size={18} />
                </button>
                <div ref={emojiRef} style={{ position: "relative" }}>
                  <button type="button" style={styles.attachBtn} onClick={() => setShowEmoji((p) => !p)} title="Emoji">
                    <FiSmile size={18} />
                  </button>
                  {showEmoji && (
                    <div style={styles.emojiPickerWrap}>
                      <EmojiPicker onEmojiClick={onEmojiClick} height={380} width={300} />
                    </div>
                  )}
                </div>
                <div
                  ref={inputRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  data-placeholder="Write a message..."
                  style={styles.input}
                />
                <button type="button" onClick={sendMessage}
                  style={{ ...styles.sendBtn, opacity: (text.trim() || imagePreview) ? 1 : 0.45 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {lightboxSrc && (
        <div style={styles.lightboxOverlay} onClick={() => setLightboxSrc(null)}>
          <button style={styles.lightboxClose} onClick={() => setLightboxSrc(null)}><FiX size={20} /></button>
          <img src={lightboxSrc} alt="preview" style={styles.lightboxImg} onClick={(e) => e.stopPropagation()} />
          {imagePreview?.dataUrl === lightboxSrc && !imagePreview?.uploaded && (
            <button
              style={styles.lightboxUploadBtn}
              onClick={(e) => { e.stopPropagation(); handleLightboxUpload(); }}
              disabled={uploadingImage}
            >
              {uploadingImage ? "Please Wait" : "Upload"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  // Layout
  page: { display: "flex", height: "calc(100vh - 60px)", background: "#f0f4f8", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" },

  // Sidebar
  sidebar: { width: "300px", background: "#1a252f", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" },
  sidebarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  sidebarTitle: { color: "#ecf0f1", fontWeight: "700", fontSize: "1.1rem", letterSpacing: "0.3px" },
  sidebarCount: { background: "#1abc9c", color: "#fff", borderRadius: "12px", padding: "2px 9px", fontSize: "0.75rem", fontWeight: "700" },
  sidebarList: { flex: 1, overflowY: "auto", padding: "8px 0" },
  noConv: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", color: "#8a9bb0" },
  convItem: { display: "flex", alignItems: "center", gap: "13px", padding: "12px 18px", cursor: "pointer", transition: "background 0.15s", borderRadius: "0" },
  convItemActive: { background: "rgba(26,188,156,0.12)", borderLeft: "3px solid #1abc9c" },
  convAvatarWrap: { position: "relative", flexShrink: 0 },
  convAvatar: { width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0 },
  onlineDot: { position: "absolute", bottom: "1px", right: "1px", width: "10px", height: "10px", borderRadius: "50%", background: "#2ecc71", border: "2px solid #1a252f" },
  convInfo: { flex: 1, minWidth: 0 },
  convName: { margin: "0 0 3px", fontWeight: "600", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" },
  convLast: { margin: 0, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#8a9bb0" },
  unreadBadge: { background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "2px 7px", fontSize: "0.68rem", fontWeight: "700", flexShrink: 0 },

  // Chat panel
  chatPanel: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f0f4f8" },
  noChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "#f0f4f8" },
  noChatIconWrap: { fontSize: "3.5rem", background: "#e8f5f2", borderRadius: "50%", width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center" },
  noChatTitle: { margin: "4px 0 0", fontWeight: "700", fontSize: "1.15rem", color: "#2c3e50" },
  noChatSub: { margin: 0, color: "#95a5a6", fontSize: "0.88rem" },

  // Chat header
  chatHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e8edf2", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  chatHeaderLeft: { display: "flex", alignItems: "center", gap: "13px" },
  chatHeaderAvatar: { width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0, border: "2px solid #1abc9c" },
  chatHeaderName: { margin: 0, fontWeight: "700", fontSize: "1rem", color: "#1a252f" },
  chatHeaderStatus: { margin: "2px 0 0", fontSize: "0.75rem", color: "#2ecc71", fontWeight: "600" },

  // Messages
  messages: { flex: 1, overflowY: "auto", padding: "24px 28px 12px", display: "flex", flexDirection: "column", gap: "12px" },
  noMessages: { margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", color: "#aab" },
  msgRow: { display: "flex", alignItems: "flex-end", gap: "9px" },
  msgAvatar: { width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 },
  bubble: { maxWidth: "58%", padding: "11px 15px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", lineHeight: "1.5" },
  bubbleMine: { background: "#1a252f", color: "#fff", borderRadius: "18px 18px 4px 18px" },
  bubbleTheirs: { background: "#fff", color: "#1a252f", borderRadius: "18px 18px 18px 4px", border: "1px solid #e8edf2" },
  bubbleText: { margin: "0 0 4px", fontSize: "0.93rem", wordBreak: "break-word" },
  bubbleTime: { fontSize: "0.67rem", display: "block", textAlign: "right" },

  // Input
  inputArea: { background: "#fff", borderTop: "1px solid #e8edf2", flexShrink: 0 },
  fmtBar: { display: "flex", gap: "6px", padding: "8px 24px 0" },
  fmtBtn: { width: "32px", height: "28px", border: "1.5px solid #dde3ea", borderRadius: "6px", background: "#f5f7fa", color: "#444", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },
  fmtBtnActive: { background: "#1a252f", color: "#fff", borderColor: "#1a252f" },
  inputRow: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 24px 14px" },
  attachBtn: { width: "38px", height: "38px", borderRadius: "50%", background: "#f0f4f8", border: "1.5px solid #dde3ea", color: "#1abc9c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" },
  imagePreviewWrap: { position: "relative", display: "inline-block", margin: "6px 24px 0", borderRadius: "10px", overflow: "visible" },
  imagePreviewImg: { width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "2px solid #1abc9c", display: "block" },
  imagePreviewRemove: { position: "absolute", top: "-8px", right: "-8px", width: "22px", height: "22px", borderRadius: "50%", background: "#e74c3c", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 },
  input: { flex: 1, minHeight: "42px", maxHeight: "120px", overflowY: "auto", padding: "10px 16px", fontSize: "0.95rem", borderRadius: "22px", border: "1.5px solid #dde3ea", outline: "none", background: "#f5f7fa", color: "#1a252f", lineHeight: "1.5", wordBreak: "break-word" },
  sendBtn: { width: "46px", height: "46px", borderRadius: "50%", background: "#1abc9c", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.2s" },
  lightboxOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" },
  lightboxImg: { maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", cursor: "default" },
  lightboxClose: { position: "absolute", top: "20px", right: "24px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  lightboxUploadBtn: { position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", background: "#1abc9c", color: "#fff", border: "none", borderRadius: "24px", padding: "10px 28px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", letterSpacing: "0.3px" },
  infoBtn: { width: "38px", height: "38px", borderRadius: "50%", background: "#e8f5f2", border: "1.5px solid #1abc9c", color: "#1abc9c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" },
  phonePopup: { position: "absolute", top: "48px", right: 0, background: "#fff", border: "1.5px solid #e8edf2", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", whiteSpace: "nowrap", zIndex: 100, minWidth: "160px", animation: "popupIn 0.18s ease forwards", transformOrigin: "top right" },
  popupTitle: { margin: "0 0 7px", fontWeight: "700", fontSize: "0.75rem", color: "#1a252f", textTransform: "uppercase", letterSpacing: "0.5px" },
  popupRow: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" },
  phoneLink: { color: "#1a252f", fontWeight: "500", fontSize: "0.8rem", textDecoration: "none" },
  emojiPickerWrap: { position: "absolute", bottom: "50px", left: 0, zIndex: 999 },
};
