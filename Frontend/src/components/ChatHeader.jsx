import { XIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);
  const isTyping = selectedUser && typingUsers[selectedUser._id];

  if (!selectedUser) return null;

  return (
    <div className="chat-header">
      <div className="chat-header-user">
        <div className="avatar small">
          {selectedUser.profilePic ? (
            <img src={selectedUser.profilePic} alt={selectedUser.name} />
          ) : (
            selectedUser.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <h4>{selectedUser.name}</h4>
          <p className={isTyping ? "typing" : isOnline ? "online" : "offline"}>
            {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setSelectedUser(null)}
      >
        <XIcon size={18} />
      </button>
    </div>
  );
}

export default ChatHeader;
