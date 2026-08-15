import { useEffect } from "react";

export function useKeyboardShortcuts(setPage, setAuthModal) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore shortcuts if user is typing in form controls
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault();
            setPage("home");
            break; // Alt+H -> Home
          case "j":
            e.preventDefault();
            setPage("journal");
            break; // Alt+J -> Journal
          case "c":
            e.preventDefault();
            setPage("chat");
            break; // Alt+C -> Chat
          case "a":
            e.preventDefault();
            setPage("ai");
            break; // Alt+A -> AI Analysis
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setPage, setAuthModal]);
}
