import { useChatStore } from '../store/useChatStore';

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs-row">
      <button
        type="button"
        className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
        onClick={() => setActiveTab('chats')}
      >
        Chats
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
        onClick={() => setActiveTab('contacts')}
      >
        Contacts
      </button>
    </div>
  );
}

export default ActiveTabSwitch;
