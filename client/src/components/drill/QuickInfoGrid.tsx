import { Target, AlertTriangle, Wrench, Play, Check, type LucideIcon } from "lucide-react";

type Card = {
  label: string;
  icon: LucideIcon;
  items: string[];
  numbered: boolean;
  /** OKLCH base color for this card's accent. */
  tone: string;
};

type Props = {
  goal?: string | null;
  problemsSolved?: string[] | null;
  equipment?: string[] | null;
  howToSteps?: string[] | null;
};

// Brighter, more saturated accent tones. Each card's icon + numbered
// badge use the full-strength tone; the card-border ring uses the same
// tone at lower alpha (set per-card via the helper below).
const TONE_GOAL = "oklch(68% 0.26 25)";        // red — primary brand
const TONE_PROBLEM = "oklch(76% 0.22 60)";     // amber
const TONE_EQUIPMENT = "oklch(76% 0.19 200)";  // teal
const TONE_HOWTO = "oklch(68% 0.20 150)";      // green

function nonEmpty(s?: string | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}
function arr(values?: string[] | null): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => (v ?? "").trim()).filter((v) => v.length > 0);
}

function CardBox({ card }: { card: Card }) {
  const Icon = card.icon;
  // Replace the closing paren of the OKLCH triple so we can splice in a / alpha.
  const baseBg = card.tone.slice(0, -1) + " / 0.18)";
  const baseBorder = card.tone.slice(0, -1) + " / 0.45)";
  const iconBg = card.tone.slice(0, -1) + " / 0.25)";

  return (
    <div
      className="w-full max-w-full min-w-0 rounded-xl p-4 sm:p-5 bg-[oklch(14%_0.005_0)] border-2 overflow-hidden"
      style={{ borderColor: baseBorder, boxShadow: `0 0 0 1px ${baseBg}, 0 0 24px -8px ${baseBg}` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: card.tone }} />
        </div>
        <span className="text-xs font-bold tracking-widest" style={{ color: card.tone }}>
          {card.label}
        </span>
      </div>
      {card.numbered ? (
        <ol className="space-y-2">
          {card.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-white leading-snug">
              <span
                className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: iconBg, color: card.tone }}
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 break-words">{it}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="space-y-1.5">
          {card.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-white leading-snug">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: card.tone }} />
              <span className="flex-1 min-w-0 break-words">{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function QuickInfoGrid({ goal, problemsSolved, equipment, howToSteps }: Props) {
  // Top-row cards (max 3, rendered as a 2-up grid)
  const topCards: Card[] = [];
  if (nonEmpty(goal)) {
    topCards.push({ label: "GOAL", icon: Target, items: [goal!.trim()], numbered: false, tone: TONE_GOAL });
  }
  const problems = arr(problemsSolved);
  if (problems.length > 0) {
    topCards.push({ label: "PROBLEM IT SOLVES", icon: AlertTriangle, items: problems, numbered: false, tone: TONE_PROBLEM });
  }
  const equip = arr(equipment);
  if (equip.length > 0) {
    topCards.push({ label: "EQUIPMENT", icon: Wrench, items: equip, numbered: false, tone: TONE_EQUIPMENT });
  }

  // How-To gets its own full-width row below — the numbered list reads
  // better with horizontal real estate.
  const steps = arr(howToSteps);
  const howToCard: Card | null = steps.length > 0
    ? { label: "HOW TO DO IT", icon: Play, items: steps, numbered: true, tone: TONE_HOWTO }
    : null;

  if (topCards.length === 0 && !howToCard) return null;

  return (
    <div className="w-full max-w-full min-w-0 space-y-3 md:space-y-4">
      {topCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-full min-w-0">
          {topCards.map((card) => (
            <CardBox key={card.label} card={card} />
          ))}
        </div>
      )}
      {howToCard && <CardBox card={howToCard} />}
    </div>
  );
}
