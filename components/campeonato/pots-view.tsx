import { Avatar } from "@/components/campeonato/voting-panel";
import type { Pots } from "@/lib/championship-pots";

const SYNE = { fontFamily: "var(--font-syne)" } as const;

export function PotsView({ pots, showStats }: { pots: Pots; showStats: boolean }) {
  const groups = [
    { name: "Meninas", emoji: "👩", players: pots.girls.map((p) => ({ ...p, average: null, votes: 0 })) },
    { name: "Homens A", emoji: "🔥", players: pots.A },
    { name: "Homens B", emoji: "⚡", players: pots.B },
    { name: "Homens C", emoji: "🌱", players: pots.C },
  ];

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.name} className="bg-card rounded-2xl p-5 shadow-sm">
          <h3
            className="text-sm font-bold tracking-wide uppercase mb-3 flex items-center gap-2"
            style={{ ...SYNE, color: "var(--color-brand)" }}
          >
            <span>{g.emoji}</span>
            {g.name}
            <span className="text-xs font-semibold text-muted-foreground normal-case tracking-normal">
              {g.players.length}
            </span>
          </h3>
          {g.players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém neste pote</p>
          ) : (
            <div className="space-y-2">
              {g.players.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar name={p.name} url={p.avatar_url} size={32} />
                  <span className="flex-1 text-sm font-medium truncate">{p.name ?? "—"}</span>
                  {showStats && g.name !== "Meninas" && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.average != null ? `${p.average.toFixed(2)} · ${p.votes} votos` : "sem votos"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
