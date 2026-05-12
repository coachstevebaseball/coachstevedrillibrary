import { useRef, useState, type ReactNode } from "react";
import { CheckCircle, Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  /** Called when swiped right past threshold */
  onSwipeRight?: () => void;
  /** Called when swiped left past threshold */
  onSwipeLeft?: () => void;
  /** Label for right swipe action (default: "Complete") */
  rightLabel?: string;
  /** Label for left swipe action (default: "Remove") */
  leftLabel?: string;
  /** Swipe threshold in pixels (default: 100) */
  threshold?: number;
  /** Whether swipe actions are enabled */
  enabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Complete",
  leftLabel = "Remove",
  threshold = 100,
  enabled = true,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || !enabled) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;

    // Prevent vertical scroll when swiping horizontally
    e.preventDefault();

    // Apply resistance at edges
    const resistance = 0.6;
    let offset = dx * resistance;

    // Only allow right swipe if handler exists, same for left
    if (offset > 0 && !onSwipeRight) offset = 0;
    if (offset < 0 && !onSwipeLeft) offset = 0;

    setOffsetX(offset);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (offsetX > threshold && onSwipeRight) {
      // Trigger right action
      setOffsetX(300); // Animate off-screen
      setTimeout(() => {
        onSwipeRight();
        setOffsetX(0);
      }, 200);
    } else if (offsetX < -threshold && onSwipeLeft) {
      // Trigger left action
      setOffsetX(-300);
      setTimeout(() => {
        onSwipeLeft();
        setOffsetX(0);
      }, 200);
    } else {
      setOffsetX(0);
    }
    isHorizontal.current = null;
  };

  const progress = Math.min(Math.abs(offsetX) / threshold, 1);
  const isRightTriggered = offsetX > threshold;
  const isLeftTriggered = offsetX < -threshold;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Right swipe background (complete) */}
      {onSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 flex items-center pl-5 transition-opacity"
          style={{ opacity: offsetX > 0 ? progress : 0 }}
        >
          <div className={`flex items-center gap-2 transition-transform ${isRightTriggered ? "scale-110" : "scale-100"}`}>
            <CheckCircle className={`w-6 h-6 ${isRightTriggered ? "text-emerald-400" : "text-emerald-400/60"}`} />
            <span className={`text-sm font-bold ${isRightTriggered ? "text-emerald-400" : "text-emerald-400/60"}`}>
              {rightLabel}
            </span>
          </div>
        </div>
      )}

      {/* Left swipe background (remove) */}
      {onSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 flex items-center pr-5 transition-opacity"
          style={{ opacity: offsetX < 0 ? progress : 0 }}
        >
          <div className={`flex items-center gap-2 transition-transform ${isLeftTriggered ? "scale-110" : "scale-100"}`}>
            <span className={`text-sm font-bold ${isLeftTriggered ? "text-rose-400" : "text-rose-400/60"}`}>
              {leftLabel}
            </span>
            <Trash2 className={`w-5 h-5 ${isLeftTriggered ? "text-rose-400" : "text-rose-400/60"}`} />
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative z-10"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
