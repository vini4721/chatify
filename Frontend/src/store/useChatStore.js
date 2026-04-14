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
  unreadCounts: {},
  typingUsers: {},
  messageListener: null,
  typingStartListener: null,
  typingStopListener: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedUser: (selectedUser) => {
    const nextUnread = { ...get().unreadCounts };
    if (selectedUser?._id) {
      delete nextUnread[selectedUser._id];
    }
    set({ selectedUser, unreadCounts: nextUnread });
  },

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
      const isFromOtherUser = newMessage.senderId !== authUser._id;

      if (isFromSelectedUser || isMyEcho) {
        set({ messages: [...get().messages, newMessage] });
      } else if (isFromOtherUser) {
        const userId = newMessage.senderId;
        const currentUnread = get().unreadCounts[userId] || 0;
        set({
          unreadCounts: {
            ...get().unreadCounts,
            [userId]: currentUnread + 1,
          },
        });
      }

      get().getMyChatPartners();

      if (isSoundEnabled && isFromSelectedUser) {
        const notification = new Audio(
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
        );
        notification.play().catch(() => {});
      }
    };

    const typingStart = ({ from }) => {
      if (!from) return;
      set({ typingUsers: { ...get().typingUsers, [from]: true } });
    };

    const typingStop = ({ from }) => {
      if (!from) return;
      const nextTyping = { ...get().typingUsers };
      delete nextTyping[from];
      set({ typingUsers: nextTyping });
    };

    socket.on('new-message', listener);
    socket.on('typing-start', typingStart);
    socket.on('typing-stop', typingStop);

    set({
      messageListener: listener,
      typingStartListener: typingStart,
      typingStopListener: typingStop,
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    const { messageListener, typingStartListener, typingStopListener } = get();

    if (socket && messageListener) {
      socket.off('new-message', messageListener);
    }

    if (socket && typingStartListener) {
      socket.off('typing-start', typingStartListener);
    }

    if (socket && typingStopListener) {
      socket.off('typing-stop', typingStopListener);
    }

    set({
      messageListener: null,
      typingStartListener: null,
      typingStopListener: null,
    });
  },

  emitTypingStart: () => {
    const { socket } = useAuthStore.getState();
    const { selectedUser } = get();
    if (socket?.connected && selectedUser?._id) {
      socket.emit('typing-start', { to: selectedUser._id });
    }
  },

  emitTypingStop: () => {
    const { socket } = useAuthStore.getState();
    const { selectedUser } = get();
    if (socket?.connected && selectedUser?._id) {
      socket.emit('typing-stop', { to: selectedUser._id });
    }
  },
}));
