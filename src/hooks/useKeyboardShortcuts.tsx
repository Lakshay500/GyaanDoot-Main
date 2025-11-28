import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig = {
    'k': () => {
      // Trigger search - will be implemented with command palette
      const event = new CustomEvent('openCommandPalette');
      window.dispatchEvent(event);
    },
    'h': () => navigate('/'),
    'c': () => navigate('/courses'),
    'd': () => navigate('/dashboard'),
    'm': () => navigate('/my-courses'),
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Check for Cmd/Ctrl + key combinations
    if ((event.metaKey || event.ctrlKey) && shortcuts[event.key]) {
      event.preventDefault();
      shortcuts[event.key]();
    }
    
    // ESC to close modals/dialogs
    if (event.key === 'Escape') {
      const closeEvent = new CustomEvent('closeModal');
      window.dispatchEvent(closeEvent);
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
};
