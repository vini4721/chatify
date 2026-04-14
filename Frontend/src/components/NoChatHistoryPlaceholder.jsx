import { MessageCircleIcon } from 'lucide-react';

function NoChatHistoryPlaceholder({ name }) {
  return (
    <div className="placeholder center">
      <div className="placeholder-icon">
        <MessageCircleIcon />
      </div>
      <h3>Start your conversation with {name}</h3>
      <p>This is the beginning of your chat history.</p>
    </div>
  );
}

export default NoChatHistoryPlaceholder;
