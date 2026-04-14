import { MessageCircleIcon } from 'lucide-react';

function NoConversationPlaceholder() {
  return (
    <div className="placeholder center">
      <div className="placeholder-icon">
        <MessageCircleIcon />
      </div>
      <h3>Select a conversation</h3>
      <p>Choose a contact or an existing chat from the left panel.</p>
    </div>
  );
}

export default NoConversationPlaceholder;
