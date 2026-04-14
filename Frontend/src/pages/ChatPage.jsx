import { useChatStore } from '../store/useChatStore';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatContainer from '../components/ChatContainer';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/ContactList';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import ProfileHeader from '../components/ProfileHeader';
import BorderAnimatedContainer from '../components/BorderAnimatedContainer';

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  return (
    <BorderAnimatedContainer className="chat-shell-v2">
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
    </BorderAnimatedContainer>
  );
}

export default ChatPage;
