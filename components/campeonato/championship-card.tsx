import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users } from "lucide-react";
import type { ChampionshipWithDetails } from "@/lib/supabase/types";

interface Props {
  championship: ChampionshipWithDetails;
}

const STATUS_CONFIG = {
  active: { label: "Aberto", bg: "rgba(52,211,153,0.15)", color: "#34d399" },
  closed: { label: "Encerrado", bg: "rgba(255,255,255,0.08)", color: "#8e8e93" },
};

export function ChampionshipCard({ championship }: Props) {
  const status = STATUS_CONFIG[championship.status];
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

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {dateLabel && <span>{dateLabel}</span>}
          <span className="flex items-center gap-1">
            <Users size={11} />
            {championship.championship_participants.length} inscritos
          </span>
        </div>
      </div>
    </Link>
  );
}
