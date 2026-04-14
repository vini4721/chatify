import { useRef } from 'react';
import { LogOutIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

function ProfileHeader() {
  const fileInputRef = useRef(null);
  const { authUser, logout, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const profilePic = typeof reader.result === 'string' ? reader.result : '';
      if (!profilePic) return;
      await updateProfile({ profilePic });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-header">
      <div className="profile-left">
        <button type="button" className="profile-avatar" onClick={() => fileInputRef.current?.click()}>
          {authUser?.profilePic ? (
            <img src={authUser.profilePic} alt={authUser.name} />
          ) : (
            <span>{authUser?.name?.slice(0, 1)?.toUpperCase()}</span>
          )}
        </button>

        <input
          ref={fileInputRef}
          className="hidden-input"
          type="file"
          accept="image/*"
          onChange={onFileChange}
        />

        <div>
          <p className="muted">Signed in as</p>
          <h3>{authUser?.name}</h3>
        </div>
      </div>

      <div className="profile-actions">
        <button type="button" className="icon-btn" onClick={toggleSound}>
          {isSoundEnabled ? <Volume2Icon size={18} /> : <VolumeXIcon size={18} />}
        </button>
        <button type="button" className="icon-btn" onClick={logout}>
          <LogOutIcon size={18} />
        </button>
      </div>
    </div>
  );
}

export default ProfileHeader;
