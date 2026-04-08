import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared/NotificationPanel';
import { SearchTrigger } from '@/components/shared/GlobalSearch';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Header() {
  const { user, currentRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user ? `${user.first_name || user.firstName} ${user.last_name || user.lastName}` : '';

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b bg-card px-4 md:px-6 gap-4">
      {/* Search (Cmd+K trigger) */}
      <div className="flex-1 max-w-md hidden sm:block">
        <SearchTrigger />
      </div>

      {/* Mobile: logo on small screens */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">PF</div>
        <span className="text-sm font-semibold">ProjectFlow</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme toggle */}
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>

        {/* Role Badge */}
        <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {currentRole?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent">
            <Avatar name={displayName} src={user?.avatar_url} size="sm" />
            <span className="hidden md:block text-sm font-medium">{displayName}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-card shadow-lg z-50">
                <div className="p-2">
                  <p className="px-2 py-1 text-sm font-medium">{displayName}</p>
                  <p className="px-2 py-1 text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {/* Mobile theme toggle */}
                <div className="border-t p-2 lg:hidden">
                  <ThemeToggle />
                </div>
                <div className="border-t p-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
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
