import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// While `isActive` is true, traps Tab/Shift+Tab inside the node referenced
// by `ref`, focuses the first focusable child on activation, and restores
// focus to whatever was focused before, on deactivation. Use for modals.
export function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return;
    const root = ref.current;
    const previouslyFocused = document.activeElement;

    const focusables = root.querySelectorAll(FOCUSABLE);
    if (focusables[0]) focusables[0].focus();

    function onKeyDown(e) {
      if (e.key !== 'Tab') return;
      const els = Array.from(root.querySelectorAll(FOCUSABLE));
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isActive, ref]);
}
