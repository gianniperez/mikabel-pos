import { useEffect } from "react";

/**
 * Custom hook to handle closing events for mystical overlays and drawers.
 * * It provides essential UX patterns by:
 * - Detecting clicks outside the specified container.
 * - Detecting clicks on navigation links within the container to auto-close.
 * - Listening for the "Escape" key for accessibility standards.
 * * @param {boolean} open - Whether the component is currently visible.
 * @param {React.RefObject<HTMLElement | null>} ref - The ref of the container to monitor.
 * @param {() => void} onClose - The callback function to trigger the closing state.
 */
export function useOnCloseEvents(
  open: boolean,
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;

      if (!document.contains(target)) return;

      const isOutside = ref.current && !ref.current.contains(target);
      const isLink = target instanceof Element && target.closest("a");

      if (isOutside) {
        onClose();
      } else if (isLink) {
        setTimeout(() => {
          onClose();
        }, 100);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, ref]);
}
