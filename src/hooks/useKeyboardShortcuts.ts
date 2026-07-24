import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Skip hotkeys if user is typing in inputs, textareas or Monaco editor
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true' ||
        activeEl.closest('.monaco-editor')
      )) {
        return;
      }

      // 2. Toggle Console Runner: Ctrl+~ / Ctrl+`
      if (e.ctrlKey && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-console-runner'));
      }

      // 3. Toggle AI Assistant: Ctrl+Shift+A (or Ctrl+I)
      if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-gemini-assistant'));
      }

      // 4. Toggle Help Shortcuts Modal: '?' or Shift+'?'
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-shortcuts-modal'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
