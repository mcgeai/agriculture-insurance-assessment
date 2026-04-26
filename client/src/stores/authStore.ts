import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  mustChangePwd: boolean;
  setAuth: (token: string, user: User, mustChangePwd: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  mustChangePwd: false,
  setAuth: (token, user, mustChangePwd) => {
    localStorage.setItem('token', token);
    set({ token, user, mustChangePwd });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, mustChangePwd: false });
  },
}));
