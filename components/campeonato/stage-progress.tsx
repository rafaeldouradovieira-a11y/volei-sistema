import { STAGES, STAGE_LABEL, type ChampionshipStage } from "@/lib/championship-stage";

export function StageProgress({
  stage,
  closed = false,
  onDark = false,
}: {
  stage: ChampionshipStage;
  closed?: boolean;
  onDark?: boolean;
}) {
  const current = closed ? STAGES.length : STAGES.indexOf(stage);
  const idle = onDark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)";
  const active = onDark ? "#ffffff" : "var(--color-brand)";
  return (
    <div className="w-full">
      <div className="flex gap-1">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i <= current ? active : idle, opacity: i < current ? 0.6 : 1 }}
          />
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className="flex-1 text-center text-[10px] font-semibold uppercase tracking-wide"
            style={{
              color: i === current ? (onDark ? "white" : "var(--color-brand)") : "rgba(255,255,255,0.4)",
            }}
          >
            {STAGE_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
