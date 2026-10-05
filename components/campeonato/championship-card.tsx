import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, MapPin } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { StageProgress } from "@/components/campeonato/stage-progress";
import { STAGE_LABEL } from "@/lib/championship-stage";
import type { ChampionshipWithDetails } from "@/lib/supabase/types";

interface Props {
  championship: ChampionshipWithDetails;
}

const STATUS_CONFIG = {
  active: { label: "Aberto", bg: "rgba(52,211,153,0.15)", color: "#34d399" },
  closed: { label: "Encerrado", bg: "rgba(255,255,255,0.08)", color: "#8e8e93" },
};

export function ChampionshipCard({ championship }: Props) {
  const status =
    championship.status === "active"
      ? { ...STATUS_CONFIG.active, label: STAGE_LABEL[championship.stage] }
      : STATUS_CONFIG.closed;
  const dateLabel = championship.date
    ? format(parseISO(championship.date), "dd 'de' MMMM", { locale: ptBR })
    : null;

  return (
    <Link href={`/campeonato/${championship.id}`} className="block group">
      <div
        className="animate-in-card bg-card rounded-xl overflow-hidden p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={{
          boxShadow: "0 1px 4px rgba(12,43,26,0.08)",
          borderLeft: "3px solid var(--color-lime)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3
            className="font-semibold text-[15px] leading-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {championship.title}
          </h3>
          <span
            className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.color, fontFamily: "var(--font-syne)" }}
          >
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {dateLabel && <span className="capitalize">{dateLabel}</span>}
          {championship.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={11} />
              <span className="truncate">{championship.location}</span>
            </span>
          )}
        </div>

        <StageProgress stage={championship.stage} closed={championship.status === "closed"} />

        <div className="flex items-center justify-between mt-3">
          <AvatarStack
            people={championship.championship_participants.map((c) => ({
              name: c.profiles.name,
              avatar_url: c.profiles.avatar_url,
            }))}
            max={5}
            size={26}
          />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={11} />
            {championship.championship_participants.length} inscritos
          </span>
        </div>
      </div>
    </Link>
  );
}
