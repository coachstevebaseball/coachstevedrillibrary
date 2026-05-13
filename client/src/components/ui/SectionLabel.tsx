import type { LucideIcon } from "lucide-react";

/**
 * SectionLabel — unified section heading for drill detail pages.
 *
 * variant="strong" — 14px uppercase, weight 700, letter-spacing 0.08em,
 *   optional lucide icon (18px, 8px gap), 24×2px colored underline accent.
 *
 * variant="quiet" — 11px uppercase, weight 600, opacity 0.55,
 *   no icon, no underline. Used for metadata labels.
 */

type StrongProps = {
  variant: "strong";
  label: string;
  icon?: LucideIcon;
  /** OKLCH color string for icon + underline accent. */
  color: string;
};

type QuietProps = {
  variant: "quiet";
  label: string;
};

type Props = StrongProps | QuietProps;

export function SectionLabel(props: Props) {
  if (props.variant === "quiet") {
    return (
      <h4
        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55 mb-2"
        style={{ lineHeight: "1.4" }}
      >
        {props.label}
      </h4>
    );
  }

  const { label, icon: Icon, color } = props;

  return (
    <div className="mb-3">
      <h3
        className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.08em] text-white"
        style={{ lineHeight: "1.4" }}
      >
        {Icon && (
          <Icon
            className="h-[18px] w-[18px] flex-shrink-0"
            style={{ color }}
          />
        )}
        <span>{label}</span>
      </h3>
      <div
        className="mt-1.5 h-[2px] w-6 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
