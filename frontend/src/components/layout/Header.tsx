import { LogOut, ChevronDown, Users, Building2, Check } from 'lucide-react';
import { useAuthStore, STAKEHOLDER_PERSONAS } from '@/store/authStore';
import { Avatar } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared/NotificationPanel';
import { SearchTrigger } from '@/components/shared/GlobalSearch';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMyDivisions } from '@/api/hooks';
import api from '@/api/client';

const IS_DEV = (import.meta as any).env?.DEV === true;

/** Ring color class per role — used on the avatar and as a visual identity cue */
const ROLE_RING: Record<string, string> = {
  org_admin:       'ring-rose-400',
  division_admin:  'ring-sky-400',
  project_manager: 'ring-blue-400',
  member:          'ring-emerald-400',
  executive:       'ring-violet-400',
  viewer:          'ring-slate-400',
};

export function Header() {
  const { user, currentRole, currentDivisionId, logout, login, switchRole, setDivision } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showDivisionMenu, setShowDivisionMenu] = useState(false);
  const { data: myDivisions = [] } = useMyDivisions();
  const activeDivision = myDivisions.find((d: any) => d.divisionId === currentDivisionId);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = async (persona: typeof STAKEHOLDER_PERSONAS[0]) => {
    if (IS_DEV) {
      // Dev mode: change local state only — backend picks up x-dev-user-id header
      switchRole(persona.role, persona);
    } else {
      // Production: actually log in as the demo account so the JWT matches the UI role
      try {
        const { data } = await api.post('/auth/login', { email: persona.email, password: 'password123' });
        const result = data.data;
        login(result.access_token, result.user, result.organizations?.[0]?.role || persona.role);
      } catch {
        // Fallback: UI-only switch (permissions may not match)
        switchRole(persona.role, persona);
      }
    }
    setShowRoleSwitcher(false);
    setShowUserMenu(false);
    navigate('/dashboard');
  };

  const displayName = user
    ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim()
    : '';
  const currentPersona = STAKEHOLDER_PERSONAS.find((p) => p.role === currentRole);
  const roleRingColor = ROLE_RING[currentRole || ''] || 'ring-primary';

  return (
    <header className="relative flex h-[60px] items-center justify-between bg-card border-b border-border/60 shadow-header px-4 md:px-6 gap-4 flex-shrink-0 animate-fade-in z-30">
      {/* QCI brand accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] qci-gradient-h" />

      {/* ── LEFT: Search ── */}
      <div className="hidden sm:flex flex-1 max-w-sm">
        <SearchTrigger />
      </div>

      {/* Mobile logo — only visible when search is hidden */}
      <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs flex-shrink-0">
          QF
        </div>
        <span className="text-xs font-semibold truncate text-foreground">Q-Flow</span>
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

        {/* Theme toggle — desktop only */}
        <div className="hidden lg:flex items-center">
          <ThemeToggle />
        </div>

        {/* Division Switcher */}
        {myDivisions.length > 0 && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowDivisionMenu((o) => !o);
                setShowUserMenu(false);
                setShowRoleSwitcher(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/70 bg-card hover:bg-muted hover:border-primary/30 transition-all duration-200 shadow-sm"
            >
              {/* Avatar-letter for division */}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white flex-shrink-0">
                {(activeDivision?.divisionName ?? 'A').charAt(0).toUpperCase()}
              </span>
              <span className="text-foreground font-medium truncate max-w-[90px]">
                {activeDivision?.divisionName || 'All Divisions'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </button>

            {showDivisionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDivisionMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border bg-card shadow-nav z-50 overflow-hidden">
                  <div className="p-2.5 border-b bg-muted/30">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Switch Division
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setDivision(null); setShowDivisionMenu(false); }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors',
                        !currentDivisionId && 'bg-primary/10 font-medium'
                      )}
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-left">All Divisions</span>
                      {!currentDivisionId && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                    {myDivisions.map((div: any) => (
                      <button
                        key={div.divisionId}
                        onClick={() => { setDivision(div.divisionId); setShowDivisionMenu(false); }}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors',
                          currentDivisionId === div.divisionId && 'bg-primary/10 font-medium'
                        )}
                      >
                        <div className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white bg-primary flex-shrink-0">
                          {div.divisionName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate">{div.divisionName}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {div.role?.replace('_', ' ')}
                          </p>
                        </div>
                        {currentDivisionId === div.divisionId && (
                          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Role Switcher — pill badge */}
        <div className="relative">
          <button
            onClick={() => { setShowRoleSwitcher(!showRoleSwitcher); setShowUserMenu(false); }}
            className={cn(
              'hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-sm',
              currentPersona?.color || 'bg-primary/10 text-primary border-primary/20'
            )}
          >
            <Users className="h-3 w-3 flex-shrink-0" />
            {currentPersona?.label || currentRole?.replace('_', ' ')}
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          </button>

          {showRoleSwitcher && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleSwitcher(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border bg-card shadow-nav z-50 overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Switch Stakeholder View
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Preview how the app looks for each role
                  </p>
                </div>
                <div className="p-2 space-y-0.5 max-h-[420px] overflow-y-auto">
                  <p className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Core Roles</p>
                  {STAKEHOLDER_PERSONAS.filter(p => p.defaultDivisionId !== 'div_ppid').map((persona) => (
                    <button
                      key={persona.email}
                      onClick={() => handleSwitchRole(persona)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted',
                        user?.id === persona.devUserId && 'bg-muted'
                      )}
                    >
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                        persona.color
                      )}>
                        {persona.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{persona.name}</span>
                          {user?.id === persona.devUserId && (
                            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <span className={cn('text-[10px] font-semibold rounded px-1 py-0.5', persona.color)}>
                          {persona.label}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{persona.description}</p>
                      </div>
                    </button>
                  ))}
                  <div className="pt-1.5 pb-0.5 border-t mt-1">
                    <p className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">PPID Division</p>
                  </div>
                  {STAKEHOLDER_PERSONAS.filter(p => p.defaultDivisionId === 'div_ppid').map((persona) => (
                    <button
                      key={persona.email}
                      onClick={() => handleSwitchRole(persona)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted',
                        user?.id === persona.devUserId && 'bg-muted'
                      )}
                    >
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                        persona.color
                      )}>
                        {persona.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{persona.name}</span>
                          {user?.id === persona.devUserId && (
                            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <span className={cn('text-[10px] font-semibold rounded px-1 py-0.5', persona.color)}>
                          {persona.label}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{persona.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notification bell */}
        <div className="flex-shrink-0">
          <NotificationBell />
        </div>

        {/* User avatar + menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowRoleSwitcher(false); }}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-muted transition-all duration-200 border border-transparent hover:border-border"
            title={displayName}
          >
            <div className={cn('ring-2 ring-offset-1 rounded-full', roleRingColor)}>
              <Avatar name={displayName} src={user?.avatar_url} size="sm" />
            </div>
            <span className="hidden md:block text-sm font-medium truncate max-w-[120px]">
              {displayName}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border bg-card shadow-nav z-50 overflow-hidden">
                {/* User info */}
                <div className="p-3 border-b bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('ring-2 ring-offset-1 rounded-full flex-shrink-0', roleRingColor)}>
                      <Avatar name={displayName} src={user?.avatar_url} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  {currentPersona && (
                    <span className={cn('mt-2 inline-flex text-[10px] font-semibold rounded-full px-2 py-0.5', currentPersona.color)}>
                      {currentPersona.label}
                    </span>
                  )}
                </div>

                {/* Mobile role switcher */}
                <div className="border-t p-2 lg:hidden">
                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Core Roles
                  </p>
                  {STAKEHOLDER_PERSONAS.filter(p => p.defaultDivisionId !== 'div_ppid').map((persona) => (
                    <button
                      key={persona.email}
                      onClick={() => handleSwitchRole(persona)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                        user?.id === persona.devUserId && 'bg-muted font-medium'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', persona.color.split(' ')[0])} />
                      {persona.label}
                    </button>
                  ))}
                  <p className="px-2 py-1 mt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-t pt-2">
                    PPID Division
                  </p>
                  {STAKEHOLDER_PERSONAS.filter(p => p.defaultDivisionId === 'div_ppid').map((persona) => (
                    <button
                      key={persona.email}
                      onClick={() => handleSwitchRole(persona)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                        user?.id === persona.devUserId && 'bg-muted font-medium'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', persona.color.split(' ')[0])} />
                      {persona.label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div className="border-t p-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
