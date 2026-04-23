import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, OrgRole } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  currentRole: OrgRole | null;
  currentDivisionId: string | null;

  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User, role: OrgRole) => void;
  logout: () => void;
  switchRole: (role: OrgRole, persona?: StakeholderPersona) => void;
  setDivision: (divisionId: string | null) => void;
}

export interface StakeholderPersona {
  role: OrgRole;
  label: string;
  name: string;
  email: string;
  description: string;
  color: string;
  devUserId: string;             // maps to backend DEV_USERS key
  defaultDivisionId: string | null;
}

// Dev personas use placeholder names/emails — never real employee data
export const STAKEHOLDER_PERSONAS: StakeholderPersona[] = [
  {
    role: 'org_admin',
    label: 'Org Admin',
    name: 'Demo Admin',
    email: 'admin@example.local',
    description: 'Full access — all divisions, all settings',
    color: 'bg-red-100 text-red-700',
    devUserId: 'dev-org_admin-id',
    defaultDivisionId: null,
  },
  {
    role: 'division_admin',
    label: 'Division Admin',
    name: 'Demo Div Admin',
    email: 'div-admin@example.local',
    description: 'Full control within Engineering division only',
    color: 'bg-orange-100 text-orange-700',
    devUserId: 'dev-division_admin-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'project_manager',
    label: 'Project Manager',
    name: 'Demo PM',
    email: 'pm@example.local',
    description: 'Manage projects & sprints in Engineering',
    color: 'bg-blue-100 text-blue-700',
    devUserId: 'dev-project_manager-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'member',
    label: 'Team Member',
    name: 'Demo Member',
    email: 'member@example.local',
    description: 'Work on tasks in Engineering division',
    color: 'bg-green-100 text-green-700',
    devUserId: 'dev-member-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'executive',
    label: 'C-Level / Executive',
    name: 'Demo Executive',
    email: 'executive@example.local',
    description: 'Cross-division reports — read-only all divisions',
    color: 'bg-purple-100 text-purple-700',
    devUserId: 'dev-executive-id',
    defaultDivisionId: null,
  },
  {
    role: 'viewer',
    label: 'Stakeholder / Viewer',
    name: 'Demo Viewer',
    email: 'viewer@example.local',
    description: 'Read-only access to assigned projects',
    color: 'bg-gray-100 text-gray-700',
    devUserId: 'dev-viewer-id',
    defaultDivisionId: null,
  },
];

// Explicit opt-in: never default to development mode if the env var is absent
const isDevelopment = (import.meta as any).env?.DEV === true;
const defaultPersona = STAKEHOLDER_PERSONAS[0];
const devToken = 'dev-token';

function personaToUser(p: StakeholderPersona): User {
  const [firstName, ...rest] = p.name.split(' ');
  return {
    id: p.devUserId,
    email: p.email,
    firstName,
    first_name: firstName,
    lastName: rest.join(' '),
    last_name: rest.join(' '),
    avatar_url: null,
  } as User;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: isDevelopment ? devToken : null,
      user: isDevelopment ? personaToUser(defaultPersona) : null,
      currentRole: isDevelopment ? defaultPersona.role : null,
      currentDivisionId: isDevelopment ? defaultPersona.defaultDivisionId : null,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      login: (token, user, role) => set({ accessToken: token, user, currentRole: role }),
      logout: () => set({ accessToken: null, user: null, currentRole: null, currentDivisionId: null }),

      switchRole: (role, persona) => {
        const p = persona || STAKEHOLDER_PERSONAS.find((s) => s.role === role) || defaultPersona;
        set({ currentRole: role, user: personaToUser(p), currentDivisionId: p.defaultDivisionId });
      },

      setDivision: (divisionId) => set({ currentDivisionId: divisionId }),
    }),
    { name: 'pm-auth' }
  )
);
