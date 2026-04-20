import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const bottomNavItems = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Tasks', path: '/my-tasks', icon: CheckSquare },
  { label: 'Alerts', path: '/notifications', icon: Bell },
  { label: 'More', path: '#menu', icon: Menu },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 sm:h-14">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path === '#menu' ? '/settings' : item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-2 text-[10px] sm:text-xs font-medium transition-colors flex-1 h-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
            title={item.label}
          >
            <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
