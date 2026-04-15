import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";

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
            {messages.map((msg) => {
              const own = msg.senderId === authUser._id;
              return (
                <article
                  key={msg._id}
                  className={`bubble-wrap ${own ? "mine" : "theirs"}`}
                >
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
                  <button
                    type="button"
                    className="reply-action"
                    onClick={() => setReplyToMessage(msg)}
                  >
                    Reply
                  </button>
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
