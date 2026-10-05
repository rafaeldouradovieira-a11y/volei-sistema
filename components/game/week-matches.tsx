import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy } from "lucide-react";
import type { Match } from "@/lib/supabase/types";

export type WeekMatch = Match & {
  games: { title: string | null; location: string; date: string } | null;
};

const SYNE = { fontFamily: "var(--font-syne)" } as const;
const T1_BG = "#1d4ed8";
const T2_BG = "#dc2626";

function firstNames(team: Match["team1"]) {
  return team.map((p) => p.name.split(" ")[0]).join(", ");
}

export function WeekMatches({ matches }: { matches: WeekMatch[] }) {
  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished");
  const recent = [...live, ...finished].slice(0, 4);

  return (
    <section className="bg-card rounded-2xl overflow-hidden mb-5 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--color-brand)" }}>
        <span className="text-xs font-bold tracking-widest uppercase text-white" style={SYNE}>
          Partidas da semana
        </span>
        <span className="flex items-center gap-2 text-xs text-white/80">
          {live.length > 0 && (
            <span
              className="font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: "rgba(255,255,255,0.2)", ...SYNE }}
            >
              ● {live.length} AO VIVO
            </span>
          )}
          <span>{matches.length} {matches.length === 1 ? "partida" : "partidas"}</span>
        </span>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma partida nos últimos 7 dias
        </p>
      ) : (
        <div className="p-3 space-y-2">
          {recent.map((m) => {
            const isLive = m.status === "live";
            return (
              <Link
                key={m.id}
                href={isLive ? `/match/${m.id}` : `/games/${m.game_id}`}
                className="block rounded-xl overflow-hidden transition-transform active:scale-[0.98]"
              >
                <div className="flex items-stretch">
                  <div className="flex-1 min-w-0 px-3 py-2" style={{ background: m.winner === 1 || isLive ? T1_BG : "rgba(29,78,216,0.25)" }}>
                    <p className="text-[10px] text-white/60 truncate">{firstNames(m.team1) || "Time 1"}</p>
                    <p className="score-number text-2xl text-white">{m.score1}</p>
                  </div>
                  <div className="flex items-center px-2" style={{ background: "#141414" }}>
                    {isLive ? (
                      <span className="text-[10px] font-bold text-red-400 animate-pulse">AO VIVO</span>
                    ) : m.winner ? (
                      <Trophy size={12} color="gold" />
                    ) : (
                      <span className="text-white/20 text-xs">×</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 px-3 py-2 text-right" style={{ background: m.winner === 2 || isLive ? T2_BG : "rgba(220,38,38,0.25)" }}>
                    <p className="text-[10px] text-white/60 truncate">{firstNames(m.team2) || "Time 2"}</p>
                    <p className="score-number text-2xl text-white">{m.score2}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground px-1 pt-1 truncate">
                  {m.games?.title || m.games?.location}
                  {m.games?.date && ` · ${format(parseISO(m.games.date), "EEE dd/MM", { locale: ptBR })}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
