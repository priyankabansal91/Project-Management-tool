import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileNav';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { KeyboardShortcutsPanel } from '@/components/shared/KeyboardShortcutsPanel';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useGlobalShortcuts({
    onHelp: () => setShowShortcuts(true),
    onNewTask: () => setShowTaskModal(true),
    onSearch: () => setSearchOpen(true),
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile, fixed width on desktop */}
      <aside className="hidden md:flex md:w-64 lg:w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="flex-shrink-0">
          <Header />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full h-full px-3 sm:px-4 md:px-6 py-4 md:py-6 pb-20 sm:pb-20 md:pb-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav - only on small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <MobileBottomNav />
      </nav>

      {/* Global search (Cmd+K) */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Keyboard shortcuts panel */}
      <KeyboardShortcutsPanel open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
