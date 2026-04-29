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

export function Header() {
  const { user, currentRole, currentDivisionId, logout, switchRole, setDivision } = useAuthStore();
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

  const handleSwitchRole = (persona: typeof STAKEHOLDER_PERSONAS[0]) => {
    switchRole(persona.role, persona);
    setShowRoleSwitcher(false);
    setShowUserMenu(false);
    navigate('/dashboard');
  };

  const displayName = user ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() : '';
  const currentPersona = STAKEHOLDER_PERSONAS.find((p) => p.role === currentRole);

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-white shadow-sm px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 flex-shrink-0">
      {/* Search */}
      <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md">
        <SearchTrigger />
      </div>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs flex-shrink-0">PF</div>
        <span className="text-xs sm:text-sm font-semibold truncate">ProjectFlow</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        <div className="hidden lg:block"><ThemeToggle /></div>

        {/* Division Switcher */}
        {myDivisions.length > 0 && (
          <div className="relative hidden md:block">
            <button
              onClick={() => { setShowDivisionMenu((o) => !o); setShowUserMenu(false); setShowRoleSwitcher(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors border"
            >
              <Building2 className="h-3 w-3 text-primary" />
              <span className="text-primary font-semibold truncate max-w-[100px]">
                {activeDivision?.divisionName || 'All Divisions'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showDivisionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDivisionMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-xl z-50 overflow-hidden">
                  <div className="p-2.5 border-b bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Switch Division</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { setDivision(null); setShowDivisionMenu(false); }}
                      className={cn('flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent transition-colors', !currentDivisionId && 'bg-accent font-medium')}
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left">All Divisions</span>
                      {!currentDivisionId && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    {myDivisions.map((div: any) => (
                      <button
                        key={div.divisionId}
                        onClick={() => { setDivision(div.divisionId); setShowDivisionMenu(false); }}
                        className={cn('flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent transition-colors', currentDivisionId === div.divisionId && 'bg-accent font-medium')}
                      >
                        <div className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-primary flex-shrink-0">
                          {div.divisionName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate">{div.divisionName}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{div.role?.replace('_', ' ')}</p>
                        </div>
                        {currentDivisionId === div.divisionId && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Role Switcher Button */}
        <div className="relative">
          <button
            onClick={() => { setShowRoleSwitcher(!showRoleSwitcher); setShowUserMenu(false); }}
            className={cn(
              'hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              currentPersona?.color || 'bg-primary/10 text-primary'
            )}
          >
            <Users className="h-3 w-3" />
            {currentPersona?.label || currentRole?.replace('_', ' ')}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showRoleSwitcher && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleSwitcher(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border bg-card shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Switch Stakeholder View</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Preview how the app looks for each role</p>
                </div>
                <div className="p-2 space-y-1">
                  {STAKEHOLDER_PERSONAS.map((persona) => (
                    <button
                      key={persona.role}
                      onClick={() => handleSwitchRole(persona)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent',
                        currentRole === persona.role && 'bg-accent'
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', persona.color)}>
                        {persona.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{persona.name}</span>
                          {currentRole === persona.role && (
                            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium">Active</span>
                          )}
                        </div>
                        <span className={cn('text-[10px] font-semibold rounded px-1 py-0.5', persona.color)}>{persona.label}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{persona.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="flex-shrink-0"><NotificationBell /></div>

        {/* User Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowRoleSwitcher(false); }}
            className="flex items-center gap-1 sm:gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors"
            title={displayName}
          >
            <Avatar name={displayName} src={user?.avatar_url} size="sm" />
            <span className="hidden md:block text-xs sm:text-sm font-medium truncate max-w-[120px]">{displayName}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 rounded-md border bg-card shadow-lg z-50">
                <div className="p-2">
                  <p className="px-2 py-1 text-sm font-medium truncate">{displayName}</p>
                  <p className="px-2 py-1 text-xs text-muted-foreground truncate">{user?.email}</p>
                  <span className={cn('ml-2 text-[10px] font-semibold rounded px-1.5 py-0.5', currentPersona?.color)}>
                    {currentPersona?.label}
                  </span>
                </div>

                {/* Mobile role switcher */}
                <div className="border-t p-2 lg:hidden">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Switch View</p>
                  {STAKEHOLDER_PERSONAS.map((persona) => (
                    <button
                      key={persona.role}
                      onClick={() => handleSwitchRole(persona)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                        currentRole === persona.role && 'bg-accent font-medium'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', persona.color.split(' ')[0])} />
                      {persona.label}
                    </button>
                  ))}
                </div>

                <div className="border-t p-2 hidden lg:block">
                  <ThemeToggle />
                </div>

                <div className="border-t p-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
