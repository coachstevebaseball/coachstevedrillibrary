import { useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  /** Threshold in pixels to trigger refresh (default: 80) */
  threshold?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  enabled = true,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    // Only activate if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      // Apply resistance — diminishing returns as you pull further
      const resistance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Snap to loading position
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / threshold, 1);
  const isTriggered = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center overflow-hidden pointer-events-none z-10"
        style={{
          height: `${pullDistance}px`,
          transition: isPulling ? "none" : "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          className="flex flex-col items-center gap-1"
          style={{
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5})`,
            transition: isPulling ? "none" : "all 0.3s ease",
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-electric animate-spin" />
          ) : (
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isTriggered ? "border-electric bg-electric/20" : "border-white/30"
              }`}
              style={{
                transform: `rotate(${progress * 180}deg)`,
              }}
            >
              <svg
                className={`w-3 h-3 transition-colors ${isTriggered ? "text-electric" : "text-white/50"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}
          <span className={`text-[10px] font-medium ${isTriggered ? "text-electric" : "text-white/40"}`}>
            {isRefreshing ? "Refreshing..." : isTriggered ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
