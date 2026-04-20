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
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-card px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 flex-shrink-0">
      {/* Search (Cmd+K trigger) - hidden on very small screens */}
      <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md">
        <SearchTrigger />
      </div>

      {/* Mobile: logo on small screens */}
      <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs flex-shrink-0">PF</div>
        <span className="text-xs sm:text-sm font-semibold truncate">ProjectFlow</span>
      </div>

      {/* Right side - flex with proper spacing */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        {/* Theme toggle - hidden on small screens */}
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>

        {/* Role Badge - hidden on small screens */}
        <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
          {currentRole?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>

        {/* Notifications */}
        <div className="flex-shrink-0">
          <NotificationBell />
        </div>

        {/* User Menu */}
        <div className="relative flex-shrink-0">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)} 
            className="flex items-center gap-1 sm:gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors"
            title={displayName}
          >
            <Avatar name={displayName} src={user?.avatar_url} size="sm" />
            <span className="hidden md:block text-xs sm:text-sm font-medium truncate max-w-[120px]">{displayName}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-card shadow-lg z-50">
                <div className="p-2">
                  <p className="px-2 py-1 text-sm font-medium truncate">{displayName}</p>
                  <p className="px-2 py-1 text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                {/* Mobile theme toggle */}
                <div className="border-t p-2 lg:hidden">
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
