import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LeaveType = 'sick' | 'casual' | 'earned' | 'wfh' | 'half_day';
export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'wfh' | 'half_day' | 'holiday';

export interface AttendanceRecord {
  date: string;           // YYYY-MM-DD
  userId: string;
  clockIn: string | null;  // ISO timestamp
  clockOut: string | null;
  status: AttendanceStatus;
  leaveType?: LeaveType;
  leaveReason?: string;
  hoursWorked: number;
  notes?: string;
}

export interface LeaveBalance {
  sick: number;
  casual: number;
  earned: number;
}

interface AttendanceState {
  records: AttendanceRecord[];
  clockInTime: string | null;      // ISO timestamp of current session start
  leaveBalance: Record<string, LeaveBalance>;

  clockIn: (userId: string) => void;
  clockOut: (userId: string) => void;
  markLeave: (userId: string, date: string, leaveType: LeaveType, reason: string) => void;
  markWFH: (userId: string, date: string) => void;
  getRecord: (userId: string, date: string) => AttendanceRecord | undefined;
  getWeekRecords: (userId: string, weekStart: string) => AttendanceRecord[];
  getMonthRecords: (userId: string, year: number, month: number) => AttendanceRecord[];
  getTodayStatus: (userId: string) => AttendanceStatus | null;
  getTeamAttendance: (date: string) => Record<string, AttendanceRecord>;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function calcHours(clockIn: string, clockOut: string): number {
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return Math.round((ms / 3600000) * 4) / 4; // nearest 0.25h
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Seed realistic past attendance for demo
function seedDemoRecords(): AttendanceRecord[] {
  const USERS = [
    'dev-org_admin-id', 'dev-division_admin-id', 'dev-project_manager-id',
    'dev-member-id', 'dev-executive-id',
  ];

  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay(); // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) continue; // skip weekends

    USERS.forEach((userId) => {
      const rand = Math.random();
      let status: AttendanceStatus = 'present';
      let clockIn: string | null = null;
      let clockOut: string | null = null;
      let leaveType: LeaveType | undefined;

      if (rand < 0.04) {
        status = 'leave';
        leaveType = 'sick';
      } else if (rand < 0.07) {
        status = 'leave';
        leaveType = 'casual';
      } else if (rand < 0.12 && userId === 'dev-member-id') {
        status = 'wfh';
      } else {
        // Present — varied timings
        const hour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
        const min = Math.floor(Math.random() * 45);
        const inDate = new Date(d);
        inDate.setHours(hour, min, 0);
        clockIn = inDate.toISOString();

        const outHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        const outDate = new Date(d);
        outDate.setHours(outHour, Math.floor(Math.random() * 60), 0);
        clockOut = outDate.toISOString();
      }

      records.push({
        date: dateStr,
        userId,
        clockIn,
        clockOut,
        status,
        leaveType,
        hoursWorked: clockIn && clockOut ? calcHours(clockIn, clockOut) : 0,
      });
    });
  }

  return records;
}

const INITIAL_BALANCE: LeaveBalance = { sick: 10, casual: 12, earned: 15 };

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: seedDemoRecords(),
      clockInTime: null,
      leaveBalance: {
        'dev-org_admin-id':       { ...INITIAL_BALANCE },
        'dev-division_admin-id':  { ...INITIAL_BALANCE },
        'dev-project_manager-id': { ...INITIAL_BALANCE },
        'dev-member-id':          { ...INITIAL_BALANCE },
        'dev-executive-id':       { ...INITIAL_BALANCE },
        'dev-viewer-id':          { ...INITIAL_BALANCE },
      },

      clockIn: (userId) => {
        const now = new Date().toISOString();
        const today = todayStr();
        set((state) => {
          const existing = state.records.find((r) => r.date === today && r.userId === userId);
          if (existing) {
            return {
              clockInTime: now,
              records: state.records.map((r) =>
                r.date === today && r.userId === userId
                  ? { ...r, clockIn: r.clockIn || now, status: 'present' }
                  : r
              ),
            };
          }
          return {
            clockInTime: now,
            records: [
              ...state.records,
              { date: today, userId, clockIn: now, clockOut: null, status: 'present', hoursWorked: 0 },
            ],
          };
        });
      },

      clockOut: (userId) => {
        const now = new Date().toISOString();
        const today = todayStr();
        const clockInTime = get().clockInTime;
        set((state) => ({
          clockInTime: null,
          records: state.records.map((r) => {
            if (r.date !== today || r.userId !== userId) return r;
            const hours = clockInTime ? calcHours(clockInTime, now) : 0;
            return { ...r, clockOut: now, hoursWorked: (r.hoursWorked || 0) + hours };
          }),
        }));
      },

      markLeave: (userId, date, leaveType, reason) => {
        set((state) => {
          const exists = state.records.some((r) => r.date === date && r.userId === userId);
          const record: AttendanceRecord = {
            date, userId, clockIn: null, clockOut: null,
            status: leaveType === 'wfh' ? 'wfh' : 'leave',
            leaveType, leaveReason: reason, hoursWorked: 0,
          };
          return {
            records: exists
              ? state.records.map((r) => (r.date === date && r.userId === userId ? record : r))
              : [...state.records, record],
            leaveBalance: {
              ...state.leaveBalance,
              [userId]: {
                ...state.leaveBalance[userId],
                [leaveType]: Math.max(0, (state.leaveBalance[userId]?.[leaveType as keyof LeaveBalance] ?? 0) - 1),
              },
            },
          };
        });
      },

      markWFH: (userId, date) => {
        set((state) => {
          const exists = state.records.some((r) => r.date === date && r.userId === userId);
          const record: AttendanceRecord = {
            date, userId, clockIn: null, clockOut: null, status: 'wfh', hoursWorked: 8,
          };
          return {
            records: exists
              ? state.records.map((r) => (r.date === date && r.userId === userId ? record : r))
              : [...state.records, record],
          };
        });
      },

      getRecord: (userId, date) =>
        get().records.find((r) => r.userId === userId && r.date === date),

      getWeekRecords: (userId, weekStart) => {
        const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        return get().records.filter((r) => r.userId === userId && dates.includes(r.date));
      },

      getMonthRecords: (userId, year, month) =>
        get().records.filter((r) => {
          if (r.userId !== userId) return false;
          const d = new Date(r.date);
          return d.getFullYear() === year && d.getMonth() === month;
        }),

      getTodayStatus: (userId) => {
        const rec = get().records.find((r) => r.userId === userId && r.date === todayStr());
        return rec?.status || null;
      },

      getTeamAttendance: (date) => {
        const result: Record<string, AttendanceRecord> = {};
        get().records.filter((r) => r.date === date).forEach((r) => { result[r.userId] = r; });
        return result;
      },
    }),
    {
      name: 'pm-attendance',
      partialize: (state) => ({
        records: state.records.filter((r) => {
          // Keep only last 90 days
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          return new Date(r.date) >= cutoff;
        }),
        clockInTime: state.clockInTime,
        leaveBalance: state.leaveBalance,
      }),
    }
  )
);
