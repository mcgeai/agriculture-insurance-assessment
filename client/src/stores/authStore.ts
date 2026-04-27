import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  mustChangePwd: boolean;
  setAuth: (token: string, user: User, mustChangePwd: boolean) => void;
  logout: () => void;
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: loadUser(),
  mustChangePwd: false,
  setAuth: (token, user, mustChangePwd) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, mustChangePwd });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, mustChangePwd: false });
  },
}));
