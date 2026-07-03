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
    label: 'System Admin',
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
    role: 'vertical_head',
    label: 'Vertical Head',
    name: 'Demo Vertical Head',
    email: 'vertical-head@example.local',
    description: 'Manage team verticals, allocate members, track vertical KPIs',
    color: 'bg-teal-100 text-teal-700',
    devUserId: 'dev-vertical_head-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'project_manager',
    label: 'Project Lead',
    name: 'Demo PM',
    email: 'pm@example.local',
    description: 'Manage projects & sprints in Engineering',
    color: 'bg-blue-100 text-blue-700',
    devUserId: 'dev-project_manager-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'team_lead',
    label: 'Team Lead',
    name: 'Demo Team Lead',
    email: 'team-lead@example.local',
    description: 'Lead a team, assign tasks, track team progress',
    color: 'bg-cyan-100 text-cyan-700',
    devUserId: 'dev-team_lead-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'hod',
    label: 'CEO/HoD',
    name: 'Demo HoD',
    email: 'hod@example.local',
    description: 'Approves/rejects requests, views MIS of all projects and verticals',
    color: 'bg-indigo-100 text-indigo-700',
    devUserId: 'dev-hod-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'member',
    label: 'Project Team Member',
    name: 'Demo Member',
    email: 'member@example.local',
    description: 'Work on tasks in Engineering division',
    color: 'bg-green-100 text-green-700',
    devUserId: 'dev-member-id',
    defaultDivisionId: 'div_engineering',
  },
  {
    role: 'executive',
    label: 'Leadership',
    name: 'Demo Executive',
    email: 'executive@example.local',
    description: 'Cross-division reports — read-only all divisions',
    color: 'bg-purple-100 text-purple-700',
    devUserId: 'dev-executive-id',
    defaultDivisionId: null,
  },
  {
    role: 'viewer',
    label: 'Others',
    name: 'Demo Viewer',
    email: 'viewer@example.local',
    description: 'Read-only access to assigned projects',
    color: 'bg-gray-100 text-gray-700',
    devUserId: 'dev-viewer-id',
    defaultDivisionId: null,
  },
  // PPID-specific personas
  {
    role: 'division_admin',
    label: 'PPID Div Admin',
    name: 'PPID divAdmin',
    email: 'ppid-divadmin@example.local',
    description: 'Division Admin for PPID division',
    color: 'bg-pink-100 text-pink-700',
    devUserId: 'dev-ppid-divadmin-id',
    defaultDivisionId: 'div_ppid',
  },
  {
    role: 'vertical_head',
    label: 'PPID Vertical Head',
    name: 'PPID VH',
    email: 'ppid-vh@example.local',
    description: 'Vertical Head for PPID division',
    color: 'bg-rose-100 text-rose-700',
    devUserId: 'dev-ppid-vh-id',
    defaultDivisionId: 'div_ppid',
  },
  {
    role: 'member',
    label: 'PPID Team Member',
    name: 'PPID TM',
    email: 'ppid-tm@example.local',
    description: 'Team Member in PPID division',
    color: 'bg-fuchsia-100 text-fuchsia-700',
    devUserId: 'dev-ppid-tm-id',
    defaultDivisionId: 'div_ppid',
  },
  {
    role: 'project_manager',
    label: 'PPID Project Lead',
    name: 'PPID PL',
    email: 'ppid-pl@example.local',
    description: 'Project Lead in PPID division',
    color: 'bg-purple-100 text-purple-700',
    devUserId: 'dev-ppid-pl-id',
    defaultDivisionId: 'div_ppid',
  },
  {
    role: 'hod',
    label: 'PPID CEO/HoD',
    name: 'PPID Hod',
    email: 'ppid-hod@example.local',
    description: 'CEO/HoD for PPID division',
    color: 'bg-violet-100 text-violet-700',
    devUserId: 'dev-ppid-hod-id',
    defaultDivisionId: 'div_ppid',
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
      login: (token, user, role) => set({ accessToken: token, user, currentRole: role, currentDivisionId: null }),
      logout: () => set({ accessToken: null, user: null, currentRole: null, currentDivisionId: null }),

      switchRole: (role, persona) => {
        const p = persona || STAKEHOLDER_PERSONAS.find((s) => s.role === role) || defaultPersona;
        set({ currentRole: role, user: personaToUser(p), currentDivisionId: p.defaultDivisionId });
      },

      setDivision: (divisionId) => set({ currentDivisionId: divisionId }),
    }),
    { name: 'pm-auth-v3' }
  )
);
