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

// Development mode: auto-login with dev user
const isDevelopment = import.meta.env.DEV;
const devUser: User = {
  id: 'dev-user-id',
  email: 'dev@example.com',
  firstName: 'Dev',
  lastName: 'User',
  avatarUrl: null,
};
const devRole: OrgRole = 'org_admin';
const devToken = 'dev-token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: isDevelopment ? devToken : null,
      user: isDevelopment ? devUser : null,
      currentRole: isDevelopment ? devRole : null,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      login: (token, user, role) => set({ accessToken: token, user, currentRole: role }),
      logout: () => set({ accessToken: null, user: null, currentRole: null }),
    }),
    { name: 'pm-auth' }
  )
);
