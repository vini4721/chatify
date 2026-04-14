import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [token, setToken] = useState(localStorage.getItem('chat_token') || '')
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem('chat_user')
    return raw ? JSON.parse(raw) : null
  })

  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])

  const socketRef = useRef(null)
  const listEndRef = useRef(null)

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [users, selectedUserId],
  )

  useEffect(() => {
    if (token && !currentUser) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session expired')
          return res.json()
        })
        .then((data) => setCurrentUser(data.user))
        .catch(() => handleLogout())
    }
  }, [token, currentUser])

  useEffect(() => {
    if (!token || !currentUser) return

    fetch(`${API_BASE}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || [])
        if (!selectedUserId && data.users?.length) {
          setSelectedUserId(data.users[0]._id)
        }
      })
      .catch(() => setUsers([]))
  }, [token, currentUser, selectedUserId])

  useEffect(() => {
    if (!token || !selectedUserId) return

    fetch(`${API_BASE}/api/messages/${selectedUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
  }, [token, selectedUserId])

  useEffect(() => {
    if (!token || !currentUser) return

    const socket = io(API_BASE, {
      auth: { token },
    })

    socketRef.current = socket

    socket.on('online-users', (userIds) => {
      setOnlineUsers(userIds)
    })

    socket.on('new-message', (incoming) => {
      if (
        incoming.senderId === selectedUserId ||
        incoming.receiverId === selectedUserId
      ) {
        setMessages((prev) => [...prev, incoming])
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, currentUser, selectedUserId])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleAuthInput(event) {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthError('')

    const endpoint = authMode === 'login' ? 'login' : 'signup'
    const payload =
      authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm

    try {
      const response = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      localStorage.setItem('chat_token', data.token)
      localStorage.setItem('chat_user', JSON.stringify(data.user))
      setToken(data.token)
      setCurrentUser(data.user)
      setAuthForm({ name: '', email: '', password: '' })
    } catch (error) {
      setAuthError(error.message)
    }
  }

  function handleLogout() {
    localStorage.removeItem('chat_token')
    localStorage.removeItem('chat_user')
    setToken('')
    setCurrentUser(null)
    setUsers([])
    setMessages([])
    setSelectedUserId('')
    setOnlineUsers([])
    socketRef.current?.disconnect()
  }

  function handleSendMessage(event) {
    event.preventDefault()
    const text = messageInput.trim()
    if (!text || !selectedUserId || !socketRef.current) return

    socketRef.current.emit('private-message', { to: selectedUserId, text }, (result) => {
      if (result?.error) return
      setMessages((prev) => [...prev, result.message])
      setMessageInput('')
    })
  }

  if (!token || !currentUser) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="tag">Real-time chat</p>
          <h1>Build Your Own Chatify</h1>
          <p className="subtext">Secure auth, online presence and instant messaging.</p>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'signup' && (
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
              {authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>

          <button
            className="switch-btn"
            onClick={() => setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
          >
            {authMode === 'login'
              ? 'New here? Create an account'
              : 'Already have an account? Login'}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="chat-shell">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div>
            <p className="tag">Signed in as</p>
            <h2>{currentUser.name}</h2>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </header>

        <div className="user-list">
          {users.map((user) => {
            const isActive = selectedUserId === user._id
            const isOnline = onlineUsers.includes(user._id)

            return (
              <button
                key={user._id}
                className={`user-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedUserId(user._id)}
              >
                <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <p className="user-name">{user.name}</p>
                  <p className={`status ${isOnline ? 'online' : 'offline'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="chat-panel">
        {selectedUser ? (
          <>
            <header className="chat-header">
              <h3>{selectedUser.name}</h3>
              <p>{onlineUsers.includes(selectedUser._id) ? 'Online now' : 'Last seen recently'}</p>
            </header>

            <div className="messages">
              {messages.map((message) => {
                const ownMessage = message.senderId === currentUser._id

                return (
                  <article key={message._id} className={`bubble-wrap ${ownMessage ? 'mine' : 'theirs'}`}>
                    <div className="bubble">{message.text}</div>
                    <span className="timestamp">{formatTime(message.createdAt)}</span>
                  </article>
                )
              })}
              <div ref={listEndRef} />
            </div>

            <form className="composer" onSubmit={handleSendMessage}>
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Write a message..."
              />
              <button type="submit" className="primary-btn">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">Start by selecting a user from the left.</div>
        )}
      </section>
    </main>
  )
}

export default App
