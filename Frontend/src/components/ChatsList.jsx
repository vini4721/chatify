import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import NoChatsFound from "./NoChatsFound";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function ChatsList() {
  const {
    chats,
    getMyChatPartners,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!chats.length) return <NoChatsFound />;

  return (
    <>
      {chats.map((user) => (
        <button
          key={user._id}
          type="button"
          className="list-item"
          onClick={() => setSelectedUser(user)}
        >
          <div className="avatar small">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.name} />
            ) : (
              user.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="list-meta">
            <p>{user.name}</p>
            <p className="username-line">ID: {user.publicId || "N/A"}</p>
            <p className="username-line">
              @{user.username || user.email?.split("@")[0] || "user"}
            </p>
            <span
              className={onlineUsers.includes(user._id) ? "online" : "offline"}
            >
              {onlineUsers.includes(user._id) ? "Online" : "Offline"}
            </span>
          </div>
          {!!unreadCounts[user._id] && (
            <span className="unread-pill">{unreadCounts[user._id]}</span>
          )}
        </button>
      ))}
    </>
  );
}

export default ChatsList;
