import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Admin-defined visibility: role -> set of paths that are HIDDEN for that role.
// Only items that exist in the base navItems for that role can be hidden.
// Admins cannot GRANT access beyond base role permissions.
type AdminHiddenMap = Record<string, string[]>; // role -> hidden paths[]

// Per-user favorites: userId -> ordered list of favorited paths
type UserFavoritesMap = Record<string, string[]>;

interface SidebarConfigState {
  adminHidden: AdminHiddenMap;
  userFavorites: UserFavoritesMap;

  // Admin actions
  toggleAdminHide: (role: string, path: string) => void;
  setAdminHidden: (role: string, paths: string[]) => void;
  resetRole: (role: string) => void;
  resetAllRoles: () => void;
  isAdminHidden: (role: string, path: string) => boolean;

  // User actions
  toggleFavorite: (userId: string, path: string) => void;
  getFavorites: (userId: string) => string[];
  isFavorite: (userId: string, path: string) => boolean;
  reorderFavorites: (userId: string, paths: string[]) => void;
}

export const useSidebarConfigStore = create<SidebarConfigState>()(
  persist(
    (set, get) => ({
      adminHidden: {},
      userFavorites: {},

      toggleAdminHide: (role, path) =>
        set((s) => {
          const current = s.adminHidden[role] ?? [];
          const isHidden = current.includes(path);
          return {
            adminHidden: {
              ...s.adminHidden,
              [role]: isHidden ? current.filter((p) => p !== path) : [...current, path],
            },
          };
        }),

      setAdminHidden: (role, paths) =>
        set((s) => ({ adminHidden: { ...s.adminHidden, [role]: paths } })),

      resetRole: (role) =>
        set((s) => {
          const next = { ...s.adminHidden };
          delete next[role];
          return { adminHidden: next };
        }),

      resetAllRoles: () => set({ adminHidden: {} }),

      isAdminHidden: (role, path) => {
        const hidden = get().adminHidden[role] ?? [];
        return hidden.includes(path);
      },

      toggleFavorite: (userId, path) =>
        set((s) => {
          const current = s.userFavorites[userId] ?? [];
          const isFav = current.includes(path);
          return {
            userFavorites: {
              ...s.userFavorites,
              [userId]: isFav ? current.filter((p) => p !== path) : [...current, path],
            },
          };
        }),

      getFavorites: (userId) => get().userFavorites[userId] ?? [],

      isFavorite: (userId, path) => {
        const favs = get().userFavorites[userId] ?? [];
        return favs.includes(path);
      },

      reorderFavorites: (userId, paths) =>
        set((s) => ({ userFavorites: { ...s.userFavorites, [userId]: paths } })),
    }),
    { name: 'pm-sidebar-config' }
  )
);
