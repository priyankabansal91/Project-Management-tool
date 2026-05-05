import { create } from 'zustand';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PPStatus =
  | 'DRAFT' | 'PENDING_CORE_REVIEW' | 'CORE_APPROVED'
  | 'PENDING_CFO_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface PreProject {
  id: string; tenderId: string; title: string;
  clientName: string; division: string; assignedPm: string;
  estimatedBudget: number; priority: Priority; status: PPStatus;
  submittedAt: string | null; stepStartedAt: string | null;
  slaThreshold: number; docsCount: number; createdAt: string;
  rejectionReason?: string;
}

const HA = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const SEED: PreProject[] = [
  { id: 'pp-001', tenderId: 'TDR/2026/HWY/003', title: 'NH-46 Highway Widening Phase III', clientName: 'MPRDC', division: 'Infrastructure', assignedPm: 'Bob Kumar', estimatedBudget: 84_000_000, priority: 'CRITICAL', status: 'PENDING_CFO_APPROVAL', submittedAt: HA(30), stepStartedAt: HA(30), slaThreshold: 72, docsCount: 4, createdAt: HA(72) },
  { id: 'pp-002', tenderId: 'TDR/2026/WTR/011', title: 'Mandla District Water Pipeline Extension', clientName: 'PHED', division: 'Water Resources', assignedPm: 'Deepak Nair', estimatedBudget: 64_000_000, priority: 'HIGH', status: 'PENDING_CORE_REVIEW', submittedAt: HA(55), stepStartedAt: HA(55), slaThreshold: 48, docsCount: 3, createdAt: HA(96) },
  { id: 'pp-003', tenderId: 'TDR/2026/SCH/007', title: 'Model School Construction — Jabalpur Block', clientName: 'DSE Madhya Pradesh', division: 'Education', assignedPm: 'Anita Joshi', estimatedBudget: 22_000_000, priority: 'MEDIUM', status: 'APPROVED', submittedAt: HA(120), stepStartedAt: null, slaThreshold: 48, docsCount: 5, createdAt: HA(168) },
  { id: 'pp-004', tenderId: 'TDR/2026/HLT/004', title: 'CHC Upgrade — Niwari District', clientName: 'NHM MP', division: 'Health', assignedPm: 'Suresh Dev', estimatedBudget: 18_500_000, priority: 'HIGH', status: 'DRAFT', submittedAt: null, stepStartedAt: null, slaThreshold: 48, docsCount: 2, createdAt: HA(24) },
  { id: 'pp-005', tenderId: 'TDR/2026/PWD/002', title: 'District Court Complex Renovation', clientName: 'PWD Bhopal', division: 'Infrastructure', assignedPm: 'Priya Singh', estimatedBudget: 55_000_000, priority: 'HIGH', status: 'CONVERTED', submittedAt: HA(240), stepStartedAt: null, slaThreshold: 48, docsCount: 6, createdAt: HA(300) },
  { id: 'pp-006', tenderId: 'TDR/2026/RD/009', title: 'Rural Road Connectivity — 14 Villages', clientName: 'PMGSY', division: 'Infrastructure', assignedPm: 'Bob Kumar', estimatedBudget: 31_000_000, priority: 'MEDIUM', status: 'REJECTED', submittedAt: HA(200), stepStartedAt: null, slaThreshold: 48, docsCount: 3, createdAt: HA(250), rejectionReason: 'Budget exceeds allocated envelope for Q2. Resubmit in Q3 planning cycle.' },
  { id: 'pp-007', tenderId: 'TDR/2026/ELK/001', title: 'Solar Power Plant — Govt Buildings Bhopal', clientName: 'MPUVN', division: 'Energy', assignedPm: 'Kiran Mehta', estimatedBudget: 42_000_000, priority: 'HIGH', status: 'CORE_APPROVED', submittedAt: HA(40), stepStartedAt: HA(6), slaThreshold: 72, docsCount: 4, createdAt: HA(96) },
];

interface PreProjectState {
  projects: PreProject[];
  addProject: (p: PreProject) => void;
  updateProject: (id: string, patch: Partial<PreProject>) => void;
}

export const usePreProjectStore = create<PreProjectState>((set) => ({
  projects: SEED,
  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
  updateProject: (id, patch) => set((s) => ({
    projects: s.projects.map((p) => p.id === id ? { ...p, ...patch } : p),
  })),
}));
