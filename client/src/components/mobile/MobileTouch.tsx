import { useState, type ReactNode } from "react";

interface MobileTouchProps {
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Scale factor on press (default: 0.97) */
  scale?: number;
  /** Whether the touch effect is enabled (default: true) */
  enabled?: boolean;
  /** onClick handler */
  onClick?: () => void;
  /** Element tag to render (default: div) */
  as?: "div" | "button" | "a";
}

/**
 * Wraps any element with a press-down scale effect for mobile touch feedback.
 * Provides immediate visual response on touch without waiting for click delay.
 */
export function MobileTouch({
  children,
  className = "",
  scale = 0.97,
  enabled = true,
  onClick,
  as: Tag = "div",
}: MobileTouchProps) {
  const [isPressed, setIsPressed] = useState(false);

  if (!enabled) {
    return (
      <Tag className={className} onClick={onClick}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={`${className} transition-transform duration-150 will-change-transform`}
      style={{
        transform: isPressed ? `scale(${scale})` : "scale(1)",
      }}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
