import { Target, AlertTriangle, Wrench, Play, Check, type LucideIcon } from "lucide-react";

type Card = {
  label: string;
  icon: LucideIcon;
  items: string[];
  numbered: boolean;
};

type Props = {
  goal?: string | null;
  problemsSolved?: string[] | null;
  equipment?: string[] | null;
  howToSteps?: string[] | null;
};

function nonEmpty(s?: string | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function arr(values?: string[] | null): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => (v ?? "").trim()).filter((v) => v.length > 0);
}

export function QuickInfoGrid({ goal, problemsSolved, equipment, howToSteps }: Props) {
  const cards: Card[] = [];

  if (nonEmpty(goal)) {
    cards.push({ label: "GOAL", icon: Target, items: [goal!.trim()], numbered: false });
  }
  const problems = arr(problemsSolved);
  if (problems.length > 0) {
    cards.push({ label: "PROBLEM IT SOLVES", icon: AlertTriangle, items: problems, numbered: false });
  }
  const equip = arr(equipment);
  if (equip.length > 0) {
    cards.push({ label: "EQUIPMENT", icon: Wrench, items: equip, numbered: false });
  }
  const steps = arr(howToSteps);
  if (steps.length > 0) {
    cards.push({ label: "HOW TO DO IT", icon: Play, items: steps, numbered: true });
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl p-5 bg-[oklch(14%_0.005_0)] border"
            style={{ borderColor: "oklch(50% 0.2 25 / 0.3)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "oklch(50% 0.2 25 / 0.18)" }}
              >
                <Icon className="h-4 w-4" style={{ color: "oklch(60% 0.2 25)" }} />
              </div>
              <span className="text-xs font-semibold tracking-widest text-white/80">
                {card.label}
              </span>
            </div>
            {card.numbered ? (
              <ol className="space-y-2">
                {card.items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/85 leading-snug">
                    <span
                      className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: "oklch(50% 0.2 25 / 0.2)", color: "oklch(70% 0.2 25)" }}
                    >
                      {i + 1}
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="space-y-1.5">
                {card.items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/85 leading-snug">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(60% 0.2 25)" }} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
