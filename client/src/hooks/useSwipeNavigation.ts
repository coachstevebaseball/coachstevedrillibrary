import { useRef, useCallback } from "react";
import { useLocation } from "wouter";

interface UseSwipeNavigationOptions {
  /** Minimum horizontal distance to trigger navigation (default: 80px) */
  threshold?: number;
  /** URL to navigate to on swipe right (back gesture) */
  backUrl?: string;
  /** Whether swipe navigation is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook that enables swipe-back navigation on mobile.
 * Attach the returned handlers to a container element.
 */
export function useSwipeNavigation({
  threshold = 80,
  backUrl,
  enabled = true,
}: UseSwipeNavigationOptions = {}) {
  const [, navigate] = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    // Only activate from left edge (first 30px)
    if (e.touches[0].clientX > 30) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
  }, [enabled]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !backUrl) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX.current;
    const dy = Math.abs(endY - startY.current);

    // Must be primarily horizontal and from left edge
    if (dx > threshold && dy < dx * 0.5 && startX.current < 30) {
      navigate(backUrl);
    }
  }, [enabled, backUrl, threshold, navigate]);

  return { onTouchStart, onTouchEnd };
}
