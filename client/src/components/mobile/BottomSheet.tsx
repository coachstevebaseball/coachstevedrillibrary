import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Height as percentage of viewport (default: 85) */
  maxHeight?: number;
  /** Show drag handle indicator */
  showHandle?: boolean;
  /** Allow closing by swiping down */
  swipeToClose?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = 85,
  showHandle = true,
  swipeToClose = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle touch start on the drag handle area
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeToClose) return;
    // Only allow drag from handle area or when content is at scroll top
    const contentEl = contentRef.current;
    if (contentEl && contentEl.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // If dragged more than 100px down, close
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 - dragY / 400 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-[rgb(14,14,16)] border-t border-white/10 shadow-2xl"
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-white/20" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/8 hover:bg-white/12 transition-colors touch-target"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 safe-area-inset-bottom"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
