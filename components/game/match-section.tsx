"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Trophy, ChevronRight, Mic2 } from "lucide-react";
import { startMatch } from "@/app/games/[id]/actions";
import type { Match, MatchPlayer } from "@/lib/supabase/types";

interface SelectablePlayer {
  id: string;
  name: string;
  type: "participant" | "guest";
  profile_id: string | null;
  listNumber: number;
}

export type MatchWithStarter = Match & { starterName: string | null };

interface Props {
  gameId: string;
  isParticipant: boolean;
  liveMatch: MatchWithStarter | null;
  todayMatches: MatchWithStarter[];
  allPlayers: SelectablePlayer[];
}

const T1_BG = "#1d4ed8";
const T2_BG = "#dc2626";

export function MatchSection({ gameId, isParticipant, liveMatch, todayMatches, allPlayers }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "team1" | "team2">("idle");
  const [format, setFormat] = useState<2 | 3 | 4>(4);
  const [team1, setTeam1] = useState<SelectablePlayer[]>([]);
  const [team2, setTeam2] = useState<SelectablePlayer[]>([]);
  const [isPending, startTransition] = useTransition();

  function togglePlayer(team: 1 | 2, p: SelectablePlayer) {
    const set = team === 1 ? team1 : team2;
    const setFn = team === 1 ? setTeam1 : setTeam2;
    setFn((prev) =>
      prev.find((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : prev.length < format ? [...prev, p] : prev
    );
  }

  function handleStart() {
    if (team1.length < 1 || team2.length < 1) return;
    const toMP = (p: SelectablePlayer): MatchPlayer => ({
      id: p.id, name: p.name, type: p.type, profile_id: p.profile_id,
    });
    startTransition(async () => {
      const res = await startMatch(gameId, team1.map(toMP), team2.map(toMP));
      if (res.error) { toast.error(res.error); return; }
      toast.success("Partida iniciada!");
      setStep("idle"); setTeam1([]); setTeam2([]);
      router.push(`/match/${res.matchId}`);
    });
  }

  function reset() { setStep("idle"); setTeam1([]); setTeam2([]); }

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: "var(--color-brand)" }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-syne)", color: "var(--color-lime)" }}
        >
          Partidas
        </span>
        {liveMatch && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
            style={{ background: "rgba(255,255,255,0.2)", color: "white", fontFamily: "var(--font-syne)" }}
          >
            ● AO VIVO
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Live match card */}
        {liveMatch && (
          <div className="space-y-1.5">
            <button
              className="w-full rounded-xl overflow-hidden flex items-stretch transition-transform active:scale-[0.98]"
              onClick={() => router.push(`/match/${liveMatch.id}`)}
            >
              <div className="flex-1 flex flex-col items-center py-4" style={{ background: T1_BG }}>
                <span className="text-white/60 text-xs mb-1">Time 1</span>
                <span className="text-white font-extrabold text-4xl" style={{ fontFamily: "var(--font-syne)" }}>
                  {liveMatch.score1}
                </span>
              </div>
              <div className="flex items-center px-3" style={{ background: "#111" }}>
                <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
              </div>
              <div className="flex-1 flex flex-col items-center py-4" style={{ background: T2_BG }}>
                <span className="text-white/60 text-xs mb-1">Time 2</span>
                <span className="text-white font-extrabold text-4xl" style={{ fontFamily: "var(--font-syne)" }}>
                  {liveMatch.score2}
                </span>
              </div>
            </button>
            {liveMatch.starterName && (
              <div className="flex items-center gap-1.5 px-1">
                <Mic2 size={11} color="#8e8e93" />
                <span className="text-xs text-muted-foreground">
                  placar por <span style={{ color: "#f2f2f2", fontWeight: 600 }}>{liveMatch.starterName.split(" ")[0]}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Start button */}
        {!liveMatch && step === "idle" && (
          isParticipant ? (
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 active:scale-[0.98]"
              style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
              onClick={() => setStep("team1")}
            >
              <Play size={15} />
              Nova partida
            </button>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-2">
              Apenas participantes podem iniciar uma partida
            </p>
          )
        )}

        {/* Team selection */}
        {step !== "idle" && (
          <TeamPicker
            step={step}
            format={format}
            onFormatChange={(f) => { setFormat(f); setTeam1([]); setTeam2([]); }}
            allPlayers={allPlayers}
            team1={team1}
            team2={team2}
            onToggle={togglePlayer}
            onNext={() => setStep("team2")}
            onStart={handleStart}
            onCancel={reset}
            isPending={isPending}
          />
        )}

        {/* Today's match history */}
        {todayMatches.length > 0 && (
          <div className="space-y-2 pt-1">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)", opacity: 0.6 }}
            >
              Histórico de hoje
            </p>
            {todayMatches.map((m) => (
              <div key={m.id} className="space-y-1">
                <div
                  className="rounded-xl overflow-hidden flex items-stretch cursor-pointer transition-transform active:scale-[0.98]"
                  onClick={() => router.push(`/match/${m.id}`)}
                >
                  <div
                    className="flex-1 flex flex-col items-center py-2"
                    style={{ background: m.winner === 1 ? T1_BG : "rgba(29,78,216,0.25)" }}
                  >
                    <span className="text-white/60 text-xs">T1</span>
                    <span className="font-extrabold text-xl text-white" style={{ fontFamily: "var(--font-syne)" }}>
                      {m.score1}
                    </span>
                  </div>
                  <div className="flex items-center px-2" style={{ background: "#141414" }}>
                    {m.winner ? <Trophy size={12} color="gold" /> : <span className="text-white/20 text-xs">×</span>}
                  </div>
                  <div
                    className="flex-1 flex flex-col items-center py-2"
                    style={{ background: m.winner === 2 ? T2_BG : "rgba(220,38,38,0.25)" }}
                  >
                    <span className="text-white/60 text-xs">T2</span>
                    <span className="font-extrabold text-xl text-white" style={{ fontFamily: "var(--font-syne)" }}>
                      {m.score2}
                    </span>
                  </div>
                </div>
                {m.starterName && (
                  <div className="flex items-center gap-1.5 px-1">
                    <Mic2 size={10} color="#8e8e93" />
                    <span className="text-xs text-muted-foreground">
                      {m.starterName.split(" ")[0]}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!liveMatch && todayMatches.length === 0 && step === "idle" && (
          <p className="text-xs text-center text-muted-foreground py-1">Nenhuma partida hoje</p>
        )}
      </div>
    </div>
  );
}

function TeamPicker({
  step, format, onFormatChange, allPlayers, team1, team2,
  onToggle, onNext, onStart, onCancel, isPending,
}: {
  step: "team1" | "team2";
  format: 2 | 3 | 4;
  onFormatChange: (f: 2 | 3 | 4) => void;
  allPlayers: SelectablePlayer[];
  team1: SelectablePlayer[];
  team2: SelectablePlayer[];
  onToggle: (team: 1 | 2, p: SelectablePlayer) => void;
  onNext: () => void;
  onStart: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const currentTeam = step === "team1" ? team1 : team2;
  const teamColor = step === "team1" ? T1_BG : T2_BG;
  const otherIds = new Set(step === "team2" ? team1.map((p) => p.id) : []);

  // Detect which first names appear more than once so we can prefix with list number
  const firstNameCount = allPlayers.reduce<Record<string, number>>((acc, p) => {
    const first = p.name.split(" ")[0];
    acc[first] = (acc[first] ?? 0) + 1;
    return acc;
  }, {});
  const displayName = (p: SelectablePlayer) => {
    const first = p.name.split(" ")[0];
    return firstNameCount[first] > 1 ? `${p.listNumber} - ${first}` : first;
  };

  const canProceed = currentTeam.length >= 1;

  return (
    <div className="space-y-3">
      {/* Header row with format selector */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "var(--font-syne)", color: teamColor }}
        >
          Time {step === "team1" ? "1" : "2"}
          <span className="ml-1.5 text-muted-foreground font-normal normal-case tracking-normal">
            {currentTeam.length}/{format}
          </span>
        </span>

        {/* Format selector — only on step 1 */}
        {step === "team1" && (
          <div
            className="flex gap-0.5 p-0.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => onFormatChange(n)}
                className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
                style={{
                  fontFamily: "var(--font-syne)",
                  background: format === n ? "var(--color-brand)" : "transparent",
                  color: format === n ? "white" : "#8e8e93",
                }}
              >
                {n}v{n}
              </button>
            ))}
          </div>
        )}

        {step === "team2" && (
          <span className="text-xs text-muted-foreground">{format}v{format}</span>
        )}
      </div>

      {/* Player grid */}
      <div
        className="rounded-xl p-3"
        style={{ background: `${teamColor}15`, border: `1.5px solid ${teamColor}30` }}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {allPlayers.map((p) => {
            const isSelected = currentTeam.some((x) => x.id === p.id);
            const isOther = otherIds.has(p.id);
            const isMaxed = currentTeam.length >= format && !isSelected;
            const disabled = isOther || isMaxed;

            return (
              <button
                key={p.id}
                disabled={disabled}
                onClick={() => onToggle(step === "team1" ? 1 : 2, p)}
                className="px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: isSelected ? teamColor : isOther ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                  color: isSelected ? "white" : isOther ? "#444" : "#e5e5e5",
                  opacity: disabled && !isSelected ? 0.35 : 1,
                  fontFamily: "var(--font-syne)",
                }}
              >
                <div className="truncate">{displayName(p)}</div>
                {(p.type === "guest" || isOther) && (
                  <div className="text-xs opacity-50 font-normal">
                    {isOther ? `Time ${step === "team2" ? "1" : "2"}` : "convidado"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "#e5e5e5", fontFamily: "var(--font-syne)" }}
          onClick={onCancel}
        >
          Cancelar
        </button>
        {step === "team1" ? (
          <button
            disabled={!canProceed}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40"
            style={{ background: "var(--color-brand)", color: "white", fontFamily: "var(--font-syne)" }}
            onClick={onNext}
          >
            Time 2 →
          </button>
        ) : (
          <button
            disabled={!canProceed || isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40"
            style={{ background: "var(--color-brand)", color: "white", fontFamily: "var(--font-syne)" }}
            onClick={onStart}
          >
            {isPending ? "Iniciando..." : "Iniciar partida"}
          </button>
        )}
      </div>
    </div>
  );
}
