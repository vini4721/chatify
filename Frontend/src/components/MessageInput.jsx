import { useRef, useState } from 'react';
import { ImageIcon, SendIcon, XIcon } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

function MessageInput() {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const { sendMessage } = useChatStore();

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    await sendMessage({ text, image: imagePreview });
    setText('');
    removeImage();
  };

  return (
    <div className="message-input-wrap">
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" />
          <button type="button" onClick={removeImage}>
            <XIcon size={14} />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="composer-row">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type your message..."
        />

        <input
          ref={fileInputRef}
          className="hidden-input"
          type="file"
          accept="image/*"
          onChange={handleImage}
        />

        <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={18} />
        </button>

        <button type="submit" className="send-btn">
          <SendIcon size={16} /> Send
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
