type Props = {
  drillType?: string | null;
  ageLevels?: string[] | null;
  focusAreas?: string[] | null;
};

const CATEGORY_PILL = "px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider";

function nonEmpty(s?: string | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}
function arr(values?: string[] | null): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => (v ?? "").trim()).filter((v) => v.length > 0);
}

// Humanize age-level slugs ("beginner-drills" → "Beginner", "all" → "All Levels").
const AGE_LEVEL_LABELS: Record<string, string> = {
  "all": "All Levels",
  "all-levels": "All Levels",
  "beginner": "Beginner",
  "beginner-drills": "Beginner",
  "intermediate": "Intermediate",
  "intermediate-drills": "Intermediate",
  "advanced": "Advanced",
  "advanced-drills": "Advanced",
  "youth": "Youth",
  "youth-8u-10u": "Youth (8U–10U)",
  "8u": "8U",
  "10u": "10U",
  "11u-12u": "11U–12U",
  "12u": "12U",
  "13u-14u": "13U–14U",
  "14u": "14U",
  "15u-and-up": "15U+",
  "high-school": "High School",
  "college": "College",
};
function formatAgeLevel(slug: string): string {
  const key = slug.toLowerCase();
  if (AGE_LEVEL_LABELS[key]) return AGE_LEVEL_LABELS[key];
  return slug
    .split(/[-_\s]+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

export function MetadataFooter({ drillType, ageLevels, focusAreas }: Props) {
  const ages = arr(ageLevels);
  const focus = arr(focusAreas);
  const hasType = nonEmpty(drillType);

  if (!hasType && ages.length === 0 && focus.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-full min-w-0">
      {hasType && (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden">
          <h4 className="text-[10px] font-bold tracking-widest text-white/75 mb-2">DRILL TYPE</h4>
          <span
            className={`${CATEGORY_PILL} text-white`}
            style={{ backgroundColor: "oklch(50% 0.2 25 / 0.25)" }}
          >
            {drillType}
          </span>
        </div>
      )}
      {ages.length > 0 && (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden">
          <h4 className="text-[10px] font-bold tracking-widest text-white/75 mb-2">AGE / LEVEL</h4>
          <div className="flex flex-wrap gap-1.5">
            {ages.map((a) => (
              <span
                key={a}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide text-white/90"
                style={{ backgroundColor: "oklch(60% 0.15 200 / 0.2)" }}
              >
                {formatAgeLevel(a)}
              </span>
            ))}
          </div>
        </div>
      )}
      {focus.length > 0 && (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden">
          <h4 className="text-[10px] font-bold tracking-widest text-white/75 mb-2">FOCUS AREAS</h4>
          <div className="flex flex-wrap gap-1.5">
            {focus.map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium lowercase tracking-wide text-white/80 bg-white/[0.06] border border-white/10"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
