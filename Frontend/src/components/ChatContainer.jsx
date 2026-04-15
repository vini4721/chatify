import { CheckSquareIcon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

function ChatContainer() {
  const { authUser } = useAuthStore();
  const {
    selectedUser,
    messages,
    getMessagesByUserId,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    setReplyToMessage,
    isSelectingMessages,
    selectedMessageIds,
    startSelectingMessages,
    stopSelectingMessages,
    toggleMessageSelection,
    deleteSelectedMessages,
  } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;

    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedUser,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedUser) return null;

  return (
    <div className="chat-body">
      <ChatHeader />

      <div className="chat-messages">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length ? (
          <div className="message-list">
            <div className="message-select-toolbar">
              {isSelectingMessages ? (
                <>
                  <p>{selectedMessageIds.length} selected</p>
                  <div className="message-select-actions">
                    <button
                      type="button"
                      className="mini-btn danger"
                      disabled={!selectedMessageIds.length}
                      onClick={deleteSelectedMessages}
                    >
                      <Trash2Icon size={14} /> Delete
                    </button>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={stopSelectingMessages}
                    >
                      <XIcon size={14} /> Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="mini-btn"
                  onClick={startSelectingMessages}
                >
                  <CheckSquareIcon size={14} /> Select messages
                </button>
              )}
            </div>

            {messages.map((msg) => {
              const msgId = normalizeId(msg._id);
              const own = normalizeId(msg.senderId) === normalizeId(authUser?._id);
              const isSelected = selectedMessageIds.includes(msgId);
              return (
                <article
                  key={msg._id}
                  className={`bubble-wrap ${own ? "mine" : "theirs"} ${isSelected ? "selected" : ""}`}
                >
                  {isSelectingMessages && own && !msg.optimistic && (
                    <button
                      type="button"
                      className={`message-select-btn ${isSelected ? "active" : ""}`}
                      onClick={() => toggleMessageSelection(msgId)}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  )}

                  {msg.replyTo && (
                    <button
                      type="button"
                      className="reply-chip"
                      onClick={() => setReplyToMessage(msg.replyTo)}
                    >
                      <span className="reply-chip-label">In reply to</span>
                      <span className="reply-chip-text">
                        {msg.replyTo.text || "Image"}
                      </span>
                    </button>
                  )}
                  <div className="bubble">
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="message-image"
                      />
                    )}
                    {msg.text && <p className="message-text">{msg.text}</p>}
                    <span className="timestamp">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {!isSelectingMessages && (
                    <button
                      type="button"
                      className="reply-action"
                      onClick={() => setReplyToMessage(msg)}
                    >
                      Reply
                    </button>
                  )}
                </article>
              );
            })}
            <div ref={endRef} />
          </div>
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.name} />
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
