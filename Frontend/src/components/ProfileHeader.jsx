import { CopyIcon, LogOutIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";
import useUiClickSound from "../hooks/useUiClickSound";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

function ProfileHeader() {
  const fileInputRef = useRef(null);
  const { playClick } = useUiClickSound();
  const { authUser, logout, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const profilePic = typeof reader.result === "string" ? reader.result : "";
      if (!profilePic) return;
      await updateProfile({ profilePic });
    };
    reader.readAsDataURL(file);
  };

  const copyUserId = async () => {
    if (!authUser?.publicId) return;
    try {
      await navigator.clipboard.writeText(authUser.publicId);
      toast.success("User ID copied");
    } catch {
      toast.error("Could not copy user ID");
    }
  };

  return (
    <div className="profile-header">
      <div className="profile-left">
        <button
          type="button"
          className="profile-avatar"
          onClick={() => fileInputRef.current?.click()}
        >
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
          <p className="muted user-id-row">
            ID: {authUser?.publicId || "Generating..."}
          </p>
        </div>
      </div>

      <div className="profile-actions">
        <button type="button" className="icon-btn" onClick={copyUserId}>
          <CopyIcon size={16} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            playClick();
            toggleSound();
          }}
        >
          {isSoundEnabled ? (
            <Volume2Icon size={18} />
          ) : (
            <VolumeXIcon size={18} />
          )}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            playClick();
            logout();
          }}
        >
          <LogOutIcon size={18} />
        </button>
      </div>
    </div>
  );
}

export default ProfileHeader;
