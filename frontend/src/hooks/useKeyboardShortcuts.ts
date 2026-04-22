import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  description: string;
  handler: () => void;
}

// Core hook that listens for keyboard events and runs matching handler
export function useKeyboardShortcut(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore when typing in inputs/textareas/contenteditable
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      for (const s of shortcuts) {
        const metaMatch  = !!s.meta  === (e.metaKey  || e.ctrlKey);
        const ctrlMatch  = s.meta    ? true : !!s.ctrl === e.ctrlKey;
        const shiftMatch = !!s.shift === e.shiftKey;
        if (e.key === s.key && metaMatch && shiftMatch) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

// Global app-level shortcuts (navigation, etc.)
// Call this once at the app shell level
export function useGlobalShortcuts(options: {
  onNewTask?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
}) {
  const navigate = useNavigate();

  // "g" prefix navigation — simple sequential key detection
  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 1500);
        return;
      }

      if (gPressed) {
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
        switch (e.key) {
          case 'd': navigate('/dashboard'); break;
          case 'p': navigate('/projects'); break;
          case 't': navigate('/my-tasks'); break;
          case 'r': navigate('/reports'); break;
          case 's': navigate('/sprints'); break;
        }
        return;
      }

      // Single-key shortcuts
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        options.onNewTask?.();
      }
      if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !e.metaKey) {
        options.onHelp?.();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, options]);
}

// The list of all shortcuts for the help panel
export const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'P'], description: 'Go to Projects' },
      { keys: ['G', 'T'], description: 'Go to My Tasks' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
      { keys: ['G', 'S'], description: 'Go to Sprints' },
    ],
  },
  {
    label: 'Actions',
    shortcuts: [
      { keys: ['N'],         description: 'New Task' },
      { keys: ['⌘', 'K'],   description: 'Open Search' },
      { keys: ['?'],         description: 'Show Keyboard Shortcuts' },
    ],
  },
  {
    label: 'Search',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate results' },
      { keys: ['↵'],       description: 'Open selected result' },
      { keys: ['ESC'],     description: 'Close search' },
    ],
  },
];
