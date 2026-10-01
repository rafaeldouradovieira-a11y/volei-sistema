import { Avatar } from "@/components/campeonato/voting-panel";
import { PotMoveSelect } from "@/components/campeonato/pot-move-select";
import type { Pots } from "@/lib/championship-pots";

const SYNE = { fontFamily: "var(--font-syne)" } as const;

interface Props {
  championshipId: string;
  pots: Pots;
  showStats: boolean;
  // admin pode mover homens entre os potes A, B e C
  canMove: boolean;
}

export function PotsView({ championshipId, pots, showStats, canMove }: Props) {
  const groups = [
    { key: "girls", name: "Meninas", emoji: "👩", players: pots.girls.map((p) => ({ ...p, average: null, votes: 0, moved: false })) },
    { key: "A", name: "Homens A", emoji: "🔥", players: pots.A },
    { key: "B", name: "Homens B", emoji: "⚡", players: pots.B },
    { key: "C", name: "Homens C", emoji: "🌱", players: pots.C },
  ] as const;

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
                  <span className="flex-1 text-sm font-medium truncate">
                    {p.name ?? "—"}
                    {p.moved && (
                      <span className="ml-2 text-[10px] font-semibold" style={{ color: "#fbbf24" }}>
                        movido
                      </span>
                    )}
                  </span>
                  {showStats && g.key !== "girls" && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.average != null ? `${p.average.toFixed(2)} · ${p.votes} votos` : "sem votos"}
                    </span>
                  )}
                  {canMove && g.key !== "girls" && (
                    <PotMoveSelect
                      championshipId={championshipId}
                      userId={p.id}
                      pot={g.key}
                      moved={p.moved}
                    />
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
