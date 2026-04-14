import { create } from 'zustand';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE, TOKEN_KEY, USER_KEY, apiFetch } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  authUser: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  token: localStorage.getItem(TOKEN_KEY) || '',
  socket: null,
  onlineUsers: [],
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,

  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ authUser: null, token: '', isCheckingAuth: false });
      return;
    }

    try {
      const data = await apiFetch('/api/auth/me');
      set({ authUser: data.user, token, isCheckingAuth: false });
      get().connectSocket();
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ authUser: null, token: '', isCheckingAuth: false });
    }
  },

  signup: async (payload) => {
    set({ isSigningUp: true });
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ authUser: data.user, token: data.token });
      toast.success('Account created successfully');
      get().connectSocket();
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (payload) => {
    set({ isLoggingIn: true });
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ authUser: data.user, token: data.token });
      toast.success('Logged in successfully');
      get().connectSocket();
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout network errors and clear local session anyway
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    get().disconnectSocket();
    set({ authUser: null, token: '', onlineUsers: [] });
    toast.success('Logged out');
  },

  updateProfile: async ({ profilePic }) => {
    const updatedUser = await apiFetch('/api/auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profilePic }),
    });

    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    set({ authUser: updatedUser });
    toast.success('Profile updated');
  },

  connectSocket: () => {
    const { token, socket } = get();
    if (!token || socket?.connected) return;

    const nextSocket = io(API_BASE, {
      auth: { token },
    });

    nextSocket.on('online-users', (users) => {
      set({ onlineUsers: users });
    });

    set({ socket: nextSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null });
  },
}));
