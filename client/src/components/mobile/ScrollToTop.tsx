import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

interface ScrollToTopProps {
  /** Scroll threshold in pixels before showing the button (default: 400) */
  threshold?: number;
  /** Offset from bottom in pixels (default: 80 to clear tab bar) */
  bottomOffset?: number;
}

export function ScrollToTop({ threshold = 400, bottomOffset = 80 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-4 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-electric/90 text-white shadow-lg shadow-electric/30 backdrop-blur-sm transition-all duration-300 touch-target ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-75 pointer-events-none"
      }`}
      style={{ bottom: `${bottomOffset}px` }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
