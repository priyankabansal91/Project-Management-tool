import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, OrgRole } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  currentRole: OrgRole | null;

  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User, role: OrgRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      currentRole: null,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      login: (token, user, role) => set({ accessToken: token, user, currentRole: role }),
      logout: () => set({ accessToken: null, user: null, currentRole: null }),
    }),
    { name: 'pm-auth' }
  )
);
