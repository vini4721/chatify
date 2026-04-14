import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState(localStorage.getItem("chat_token") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem("chat_user");
    return raw ? JSON.parse(raw) : null;
  });

  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState("chats");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(
    JSON.parse(localStorage.getItem("is_sound_enabled") || "false"),
  );

  const socketRef = useRef(null);
  const listEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const selectedUserIdRef = useRef("");

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const activeList = activeTab === "chats" ? chats : users;

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    if (token && !currentUser) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session expired");
          return res.json();
        })
        .then((data) => setCurrentUser(data.user))
        .catch(() => handleLogout());
    }
  }, [token, currentUser]);

  useEffect(() => {
    if (!token || !currentUser) return;

    setIsUsersLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/messages/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch(`${API_BASE}/api/messages/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([contactsData, chatsData]) => {
        setUsers(contactsData.users || []);
        setChats(chatsData.users || []);

        const fallback =
          (chatsData.users || [])[0]?._id || (contactsData.users || [])[0]?._id;
        if (!selectedUserId && fallback) {
          setSelectedUserId(fallback);
        }
      })
      .catch(() => {
        setUsers([]);
        setChats([]);
      })
      .finally(() => setIsUsersLoading(false));
  }, [token, currentUser, selectedUserId]);

  useEffect(() => {
    if (!token || !selectedUserId) return;

    setIsMessagesLoading(true);

    fetch(`${API_BASE}/api/messages/${selectedUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setIsMessagesLoading(false));
  }, [token, selectedUserId]);

  useEffect(() => {
    if (!token || !currentUser) return;

    const socket = io(API_BASE, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("online-users", (userIds) => {
      setOnlineUsers(userIds);
    });

    socket.on("new-message", (incoming) => {
      const selected = selectedUserIdRef.current;
      if (incoming.senderId === selected || incoming.receiverId === selected) {
        setMessages((prev) => [...prev, incoming]);
      }

      const partnerId =
        incoming.senderId === currentUser._id
          ? incoming.receiverId
          : incoming.senderId;
      if (partnerId !== currentUser._id) {
        setChats((prev) => {
          const exists = prev.some((user) => user._id === partnerId);
          if (exists) return prev;
          const fromContacts = users.find((user) => user._id === partnerId);
          return fromContacts ? [fromContacts, ...prev] : prev;
        });
      }

      if (isSoundEnabled && incoming.senderId !== currentUser._id) {
        const notification = new Audio(
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        );
        notification.play().catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUser, users, isSoundEnabled]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleAuthInput(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");

    const endpoint = authMode === "login" ? "login" : "signup";
    const payload =
      authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : authForm;

    try {
      const response = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("chat_token", data.token);
      localStorage.setItem("chat_user", JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error.message);
    }
  }

  function handleLogout() {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});

    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken("");
    setCurrentUser(null);
    setUsers([]);
    setChats([]);
    setMessages([]);
    setSelectedUserId("");
    setOnlineUsers([]);
    socketRef.current?.disconnect();
  }

  function toggleSound() {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    localStorage.setItem("is_sound_enabled", JSON.stringify(next));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  }

  function clearImagePreview() {
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const profilePic = typeof reader.result === 'string' ? reader.result : '';
      if (!profilePic) return;

      try {
        const response = await fetch(`${API_BASE}/api/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePic }),
        });

        const data = await response.json();
        if (!response.ok) return;

        const nextUser = {
          ...currentUser,
          profilePic: data.profilePic,
        };
        setCurrentUser(nextUser);
        localStorage.setItem('chat_user', JSON.stringify(nextUser));
      } catch {
        // no-op
      }
    };

    reader.readAsDataURL(file);
  }

  function handleSendMessage(event) {
    event.preventDefault();
    const text = messageInput.trim();
    if ((!text && !imagePreview) || !selectedUserId || !socketRef.current)
      return;

    socketRef.current.emit(
      "private-message",
      { to: selectedUserId, text, image: imagePreview },
      (result) => {
        if (result?.error) return;
        setMessages((prev) => [...prev, result.message]);
        setMessageInput("");
        clearImagePreview();

        setChats((prev) => {
          const exists = prev.some((user) => user._id === selectedUserId);
          if (exists) return prev;
          return selectedUser ? [selectedUser, ...prev] : prev;
        });
      },
    );
  }

  if (!token || !currentUser) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="tag">Real-time chat</p>
          <h1>Build Your Own Chatify</h1>
          <p className="subtext">
            Secure auth, online presence and instant messaging.
          </p>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === "signup" && (
              <input
                name="name"
                value={authForm.name}
                onChange={handleAuthInput}
                placeholder="Your name"
                required
              />
            )}

            <input
              name="email"
              type="email"
              value={authForm.email}
              onChange={handleAuthInput}
              placeholder="Email"
              required
            />

            <input
              name="password"
              type="password"
              value={authForm.password}
              onChange={handleAuthInput}
              placeholder="Password"
              minLength={6}
              required
            />

            {authError && <p className="error-text">{authError}</p>}

            <button type="submit" className="primary-btn">
              {authMode === "login" ? "Login" : "Create account"}
            </button>
          </form>

          <button
            className="switch-btn"
            onClick={() =>
              setAuthMode((prev) => (prev === "login" ? "signup" : "login"))
            }
          >
            {authMode === "login"
              ? "New here? Create an account"
              : "Already have an account? Login"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="chat-shell">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="profile-summary">
            <button
              type="button"
              className="profile-avatar"
              onClick={() => profileInputRef.current?.click()}
            >
              {currentUser.profilePic ? (
                <img src={currentUser.profilePic} alt="Profile" />
              ) : (
                <span>{currentUser.name.slice(0, 1).toUpperCase()}</span>
              )}
            </button>

            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={handleProfileImageChange}
            />

            <p className="tag">Signed in as</p>
            <h2>{currentUser.name}</h2>
          </div>
          <div className="header-actions">
            <button onClick={toggleSound} className="logout-btn" type="button">
              {isSoundEnabled ? "Sound On" : "Sound Off"}
            </button>
            <button onClick={handleLogout} className="logout-btn" type="button">
              Logout
            </button>
          </div>
        </header>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "chats" ? "active" : ""}`}
            onClick={() => setActiveTab("chats")}
            type="button"
          >
            Chats
          </button>
          <button
            className={`tab-btn ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => setActiveTab("contacts")}
            type="button"
          >
            Contacts
          </button>
        </div>

        <div className="user-list">
          {isUsersLoading && (
            <>
              {[1, 2, 3].map((item) => (
                <div key={item} className="user-card skeleton" />
              ))}
            </>
          )}

          {!isUsersLoading && activeList.length === 0 && (
            <div className="empty-chat small">
              {activeTab === "chats"
                ? "No conversations yet. Start a chat from Contacts."
                : "No contacts available yet."}
            </div>
          )}

          {!isUsersLoading &&
            activeList.map((user) => {
              const isActive = selectedUserId === user._id;
              const isOnline = onlineUsers.includes(user._id);

              return (
                <button
                  key={user._id}
                  className={`user-card ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedUserId(user._id)}
                >
                  <div className="avatar">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="avatar-image" />
                    ) : (
                      user.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="user-name">{user.name}</p>
                    <p className={`status ${isOnline ? "online" : "offline"}`}>
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </aside>

      <section className="chat-panel">
        {selectedUser ? (
          <>
            <header className="chat-header">
              <h3>{selectedUser.name}</h3>
              <p>
                {onlineUsers.includes(selectedUser._id)
                  ? "Online now"
                  : "Last seen recently"}
              </p>
            </header>

            <div className="messages">
              {isMessagesLoading && (
                <>
                  {[1, 2, 3, 4].map((item) => (
                    <article
                      key={item}
                      className={`bubble-wrap ${item % 2 ? "mine" : "theirs"}`}
                    >
                      <div className="bubble skeleton-line" />
                    </article>
                  ))}
                </>
              )}

              {!isMessagesLoading && messages.length === 0 && (
                <div className="empty-chat">
                  Start your conversation with {selectedUser.name}.
                </div>
              )}

              {!isMessagesLoading &&
                messages.map((message) => {
                  const ownMessage = message.senderId === currentUser._id;

                  return (
                    <article
                      key={message._id}
                      className={`bubble-wrap ${ownMessage ? "mine" : "theirs"}`}
                    >
                      <div className="bubble">
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Shared"
                            className="message-image"
                          />
                        )}
                        {message.text && (
                          <p className="message-text">{message.text}</p>
                        )}
                      </div>
                      <span className="timestamp">
                        {formatTime(message.createdAt)}
                      </span>
                    </article>
                  );
                })}
              <div ref={listEndRef} />
            </div>

            <form className="composer" onSubmit={handleSendMessage}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
              />

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={clearImagePreview}>
                    x
                  </button>
                </div>
              )}

              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Write a message..."
              />
              <button
                type="button"
                className="secondary-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Image
              </button>
              <button type="submit" className="primary-btn">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            Start by selecting a user from the left.
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
