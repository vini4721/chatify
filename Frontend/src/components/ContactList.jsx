import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import UsersLoadingSkeleton from './UsersLoadingSkeleton';

function ContactList() {
  const { allContacts, getAllContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((user) => (
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
            <span className={onlineUsers.includes(user._id) ? 'online' : 'offline'}>
              {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
            </span>
          </div>
        </button>
      ))}
    </>
  );
}

export default ContactList;
