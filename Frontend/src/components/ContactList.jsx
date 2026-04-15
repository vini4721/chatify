import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function ContactList() {
  const [searchInput, setSearchInput] = useState("");
  const {
    allContacts,
    getAllContacts,
    setSelectedUser,
    isUsersLoading,
    searchUsers,
    clearUserSearchResults,
    userSearchResults,
    isSearchingUser,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  const isSearchingMode = searchInput.trim().length > 0;
  const visibleUsers = useMemo(
    () => (isSearchingMode ? userSearchResults : allContacts),
    [allContacts, isSearchingMode, userSearchResults],
  );

  const submitSearch = async (event) => {
    event.preventDefault();
    await searchUsers(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    clearUserSearchResults();
  };

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="contacts-panel">
      <form className="user-search-row" onSubmit={submitSearch}>
        <input
          type="text"
          value={searchInput}
          onChange={(event) => {
            const next = event.target.value;
            setSearchInput(next);
            if (!next.trim()) {
              clearUserSearchResults();
            }
          }}
          placeholder="Search by username"
          title="Search by User ID (CHAT-XXXXXX), username, or name"
        />
        <button type="submit" className="icon-btn" disabled={isSearchingUser}>
          <SearchIcon size={16} />
        </button>
        {isSearchingMode && (
          <button type="button" className="mini-btn" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      <div className="contact-list-items">
        {isSearchingMode && isSearchingUser && <UsersLoadingSkeleton />}

        {!isSearchingUser && isSearchingMode && !visibleUsers.length && (
          <div className="placeholder compact">
            <p>No users found for "{searchInput.trim()}"</p>
          </div>
        )}

        {!isSearchingUser &&
          visibleUsers.map((user) => (
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
                  className={
                    onlineUsers.includes(user._id) ? "online" : "offline"
                  }
                >
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </span>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

export default ContactList;
