import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('aeris_token');
    if (!token) return set({ loading: false });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      localStorage.removeItem('aeris_token');
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('aeris_token', data.token);
    set({ user: data.user });
    return data.user;
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('aeris_token', data.token);
    set({ user: data.user });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('aeris_token');
    set({ user: null });
  },

  updatePreferences: async (preferences) => {
    const { data } = await api.put('/auth/preferences', preferences);
    set((state) => ({ user: { ...state.user, preferences: data.preferences } }));
  }
}));