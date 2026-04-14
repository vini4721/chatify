import { create } from 'zustand';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: 'chats',
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem('is_sound_enabled') || 'false'),
  messageListener: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  toggleSound: () => {
    const next = !get().isSoundEnabled;
    localStorage.setItem('is_sound_enabled', JSON.stringify(next));
    set({ isSoundEnabled: next });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const data = await apiFetch('/api/messages/contacts');
      set({ allContacts: data.users || [] });
    } catch (error) {
      toast.error(error.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const data = await apiFetch('/api/messages/chats');
      set({ chats: data.users || [] });
    } catch (error) {
      toast.error(error.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const data = await apiFetch(`/api/messages/${userId}`);
      set({ messages: data.messages || [] });
    } catch (error) {
      set({ messages: [] });
      toast.error(error.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async ({ text, image }) => {
    const { selectedUser, messages } = get();
    const { socket, authUser } = useAuthStore.getState();

    if (!selectedUser) return;
    if (!text?.trim() && !image) return;

    const optimisticMessage = {
      _id: `tmp-${Date.now()}`,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: text?.trim() || '',
      image: image || '',
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    if (socket?.connected) {
      socket.emit(
        'private-message',
        { to: selectedUser._id, text: text?.trim() || '', image: image || '' },
        (result) => {
          if (result?.error) {
            set({ messages });
            toast.error(result.error);
            return;
          }

          set({ messages: [...messages, result.message] });
          get().getMyChatPartners();
        }
      );
      return;
    }

    try {
      const data = await apiFetch(`/api/messages/send/${selectedUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text?.trim() || '', image: image || '' }),
      });

      set({ messages: [...messages, data.message] });
      get().getMyChatPartners();
    } catch (error) {
      set({ messages });
      toast.error(error.message);
    }
  },

  subscribeToMessages: () => {
    const { socket, authUser } = useAuthStore.getState();
    const { selectedUser, isSoundEnabled } = get();

    if (!socket || !selectedUser) return;

    const listener = (newMessage) => {
      const isFromSelectedUser = newMessage.senderId === selectedUser._id;
      const isMyEcho = newMessage.senderId === authUser._id;
      if (!isFromSelectedUser && !isMyEcho) return;

      set({ messages: [...get().messages, newMessage] });

      if (isSoundEnabled && isFromSelectedUser) {
        const notification = new Audio(
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
        );
        notification.play().catch(() => {});
      }
    };

    socket.on('new-message', listener);
    set({ messageListener: listener });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    const { messageListener } = get();

    if (socket && messageListener) {
      socket.off('new-message', messageListener);
    }

    set({ messageListener: null });
  },
}));
