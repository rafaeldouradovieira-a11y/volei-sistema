"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveChampionshipVote } from "@/app/campeonato/[id]/actions";

export interface VotingCandidate {
  id: string;
  name: string | null;
  avatar_url: string | null;
  age: number | null;
  height_cm: number | null;
}

interface Props {
  championshipId: string;
  candidates: VotingCandidate[];
  initialScores: Record<string, number>;
  deadline: string | null;
}

const SYNE = { fontFamily: "var(--font-syne)" } as const;

export function VotingPanel({ championshipId, candidates, initialScores, deadline }: Props) {
  const [scores, setScores] = useState<Record<string, number>>(initialScores);

  async function vote(candidateId: string, score: number | null) {
    const previous = scores[candidateId];
    setScores((prev) => {
      const next = { ...prev };
      if (score === null) delete next[candidateId];
      else next[candidateId] = score;
      return next;
    });

    const res = await saveChampionshipVote(championshipId, candidateId, score);
    if (res.error) {
      toast.error(res.error);
      setScores((prev) => {
        const next = { ...prev };
        if (previous === undefined) delete next[candidateId];
        else next[candidateId] = previous;
        return next;
      });
    }
  }

  const voted = candidates.filter((c) => scores[c.id] !== undefined).length;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <h3
          className="text-sm font-bold tracking-wide uppercase mb-1"
          style={{ ...SYNE, color: "var(--color-brand)" }}
        >
          Dê uma nota de 1 a 5
        </h3>
        <p className="text-xs text-muted-foreground">
          Não conhece? Deixe sem nota. Seus votos são secretos e você pode mudar até o fim
          {deadline ? ` (${deadline})` : ""}.
        </p>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full transition-all"
            style={{
              width: candidates.length ? `${(voted / candidates.length) * 100}%` : "0%",
              background: "var(--color-brand)",
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {voted} de {candidates.length} com nota
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-6">
          Ninguém para votar por enquanto
        </p>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => {
            const current = scores[c.id];
            return (
              <div key={c.id} className="bg-card rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={c.name} url={c.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={SYNE}>
                      {c.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[c.age != null && `${c.age} anos`, c.height_cm != null && `${c.height_cm} cm`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {current !== undefined && (
                    <button
                      onClick={() => vote(c.id, null)}
                      className="text-xs underline text-muted-foreground shrink-0"
                    >
                      limpar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => vote(c.id, current === n ? null : n)}
                      aria-pressed={current === n}
                      className="h-10 rounded-lg font-bold text-sm transition-all active:scale-95"
                      style={{
                        background: current === n ? "var(--color-brand)" : "rgba(255,255,255,0.08)",
                        color: current === n ? "white" : "inherit",
                        ...SYNE,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, url, size = 40 }: { name: string | null; url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name ?? ""}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.08)",
        fontSize: size * 0.4,
        ...SYNE,
      }}
    >
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}
