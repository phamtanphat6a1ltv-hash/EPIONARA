import { useEffect, useRef } from "react";

export function useFocusTrap(isActive) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Helper to get focusable elements
    const getFocusable = () => {
      if (!containerRef.current) return [];
      return Array.from(
        containerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => {
        // Simple visibility check
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    const focusable = getFocusable();
    const first = focusable[0];

    // Focus the first element when modal opens
    if (first) {
      first.focus();
    }

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      
      const currentFocusable = getFocusable();
      if (currentFocusable.length === 0) return;
      
      const firstEl = currentFocusable[0];
      const lastEl = currentFocusable[currentFocusable.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isActive]);

  return containerRef;
}
