import { MessageCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="placeholder compact">
      <MessageCircleIcon />
      <p>No conversations yet</p>
      <button
        type="button"
        className="mini-btn"
        onClick={() => setActiveTab("contacts")}
      >
        Find Contacts
      </button>
    </div>
  );
}

export default NoChatsFound;
