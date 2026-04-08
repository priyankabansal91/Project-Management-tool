import { Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { NotificationBell } from '@/components/shared/NotificationPanel';
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
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks, projects..." className="pl-9 bg-secondary/50" />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-card shadow-lg z-50">
              <div className="p-2">
                <p className="px-2 py-1 text-sm font-medium">{displayName}</p>
                <p className="px-2 py-1 text-xs text-muted-foreground">{user?.email}</p>
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
          )}
        </div>
      </div>
    </header>
  );
}
