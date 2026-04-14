import { useChatStore } from '../store/useChatStore';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatContainer from '../components/ChatContainer';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/ContactList';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import ProfileHeader from '../components/ProfileHeader';

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  return (
    <div className="chat-shell-v2">
      <aside className="chat-left">
        <ProfileHeader />
        <ActiveTabSwitch />
        <div className="left-scroll">
          {activeTab === 'chats' ? <ChatsList /> : <ContactList />}
        </div>
      </aside>

      <section className="chat-right">
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </section>
    </div>
  );
}

export default ChatPage;
