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

export function MetadataFooter({ drillType, ageLevels, focusAreas }: Props) {
  const ages = arr(ageLevels);
  const focus = arr(focusAreas);
  const hasType = nonEmpty(drillType);

  if (!hasType && ages.length === 0 && focus.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {hasType && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-[10px] font-semibold tracking-widest text-white/45 mb-2">DRILL TYPE</h4>
          <span
            className={`${CATEGORY_PILL} text-white`}
            style={{ backgroundColor: "oklch(50% 0.2 25 / 0.25)" }}
          >
            {drillType}
          </span>
        </div>
      )}
      {ages.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-[10px] font-semibold tracking-widest text-white/45 mb-2">AGE / LEVEL</h4>
          <div className="flex flex-wrap gap-1.5">
            {ages.map((a) => (
              <span
                key={a}
                className={`${CATEGORY_PILL} text-white/85`}
                style={{ backgroundColor: "oklch(60% 0.15 200 / 0.2)" }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
      {focus.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-[10px] font-semibold tracking-widest text-white/45 mb-2">FOCUS AREAS</h4>
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
