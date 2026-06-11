"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Maximize2, Minimize2, Mic2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addPoint, removePoint, endMatch } from "./actions";
import type { Match, MatchPlayer } from "@/lib/supabase/types";

const T1_BG = "#1d4ed8";
const T2_BG = "#dc2626";

function elapsed(startedAt: string) {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
}
function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}
function firstNames(players: MatchPlayer[]) {
  return players.map((p) => p.name.split(" ")[0]).join(" · ");
}

interface Props {
  initialMatch: Match;
  currentUserId: string | null;
  starterName: string | null;
}

export default function Scoreboard({ initialMatch, currentUserId, starterName }: Props) {
  const router = useRouter();
  const [match, setMatch] = useState(initialMatch);
  const [timer, setTimer] = useState(elapsed(initialMatch.started_at));
  const [endOpen, setEndOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flash, setFlash] = useState<{ team: 1 | 2; key: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isStarter = currentUserId === match.started_by;
  const isLive = match.status === "live";

  // Realtime score sync
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`match-${match.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}`,
      }, (payload) => setMatch((prev) => ({ ...prev, ...(payload.new as Partial<Match>) })))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [match.id]);

  // Timer
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setTimer(elapsed(match.started_at)), 1000);
    return () => clearInterval(id);
  }, [isLive, match.started_at]);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      try { await (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> }).lock("landscape"); } catch {}
    } else {
      await document.exitFullscreen().catch(() => {});
      try { (screen.orientation as ScreenOrientation & { unlock: () => void }).unlock(); } catch {}
    }
  }

  const doPoint = useCallback((team: 1 | 2) => {
    if (!isStarter || !isLive || isPending) return;
    setFlash({ team, key: Date.now() });
    setMatch((prev) => ({
      ...prev,
      score1: team === 1 ? prev.score1 + 1 : prev.score1,
      score2: team === 2 ? prev.score2 + 1 : prev.score2,
    }));
    startTransition(async () => {
      const res = await addPoint(match.id, team);
      if (res.error) {
        toast.error(res.error);
        setMatch((prev) => ({
          ...prev,
          score1: team === 1 ? Math.max(0, prev.score1 - 1) : prev.score1,
          score2: team === 2 ? Math.max(0, prev.score2 - 1) : prev.score2,
        }));
      }
    });
  }, [isStarter, isLive, isPending, match.id]);

  function doUndo(e: React.MouseEvent, team: 1 | 2) {
    e.stopPropagation();
    if (!isStarter || !isLive) return;
    setMatch((prev) => ({
      ...prev,
      score1: team === 1 ? Math.max(0, prev.score1 - 1) : prev.score1,
      score2: team === 2 ? Math.max(0, prev.score2 - 1) : prev.score2,
    }));
    startTransition(async () => {
      const res = await removePoint(match.id, team);
      if (res.error) toast.error(res.error);
    });
  }

  async function handleEnd(winner: 1 | 2) {
    const res = await endMatch(match.id, winner);
    if (res.error) { toast.error(res.error); return; }
    setEndOpen(false);
    toast.success("Partida encerrada!");
    setTimeout(() => router.push(`/games/${match.game_id}`), 1500);
  }

  const winnerTeam = match.winner === 1 ? match.team1 : match.winner === 2 ? match.team2 : null;

  return (
    <div
      className="fixed inset-0 flex flex-col select-none overflow-hidden"
      style={{ fontFamily: "var(--font-nunito)", touchAction: "none" }}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      >
        {/* Left: starter indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Mic2 size={13} color="rgba(255,255,255,0.5)" />
          <span className="text-xs text-white/50 truncate max-w-[100px]">
            {starterName ? starterName.split(" ")[0] : "—"}
          </span>
        </div>

        {/* Center: timer + status */}
        <div className="flex items-center gap-3">
          {isLive ? (
            <span className="font-mono text-white text-lg font-bold tracking-widest">
              {formatTime(timer)}
            </span>
          ) : (
            <span className="text-white font-bold text-sm">
              {match.winner ? `Time ${match.winner} venceu` : "Encerrada"}
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {isStarter && isLive && (
            <button
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
              onClick={() => setEndOpen(true)}
            >
              Encerrar
            </button>
          )}
          {!isLive && (
            <button
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
              onClick={() => router.push(`/games/${match.game_id}`)}
            >
              Voltar
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Split scoreboard — each half is fully tappable */}
      <div className="flex-1 flex pt-12 pb-0">
        {/* Team 1 — entire half tappable */}
        <div
          className="flex-1 relative flex flex-col items-center justify-center gap-3 cursor-pointer"
          style={{ background: T1_BG }}
          onClick={() => doPoint(1)}
        >
          {/* Flash overlay */}
          {flash?.team === 1 && (
            <FlashOverlay key={flash.key} />
          )}

          <span className="text-white/60 text-sm font-bold uppercase tracking-widest">Time 1</span>
          <span
            className="text-white font-black leading-none tabular-nums"
            style={{ fontSize: "clamp(96px, 30vw, 260px)" }}
          >
            {match.score1}
          </span>
          <span className="text-white/40 text-xs text-center px-4 leading-relaxed max-w-[160px]">
            {firstNames(match.team1)}
          </span>

          {isStarter && isLive && (
            <>
              <span className="text-white/25 text-xs mt-2">toque para pontuar</span>
              <button
                className="absolute bottom-6 left-4 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
                style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
                onClick={(e) => doUndo(e, 1)}
              >
                −1
              </button>
            </>
          )}
        </div>

        {/* Thin divider */}
        <div className="w-px" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* Team 2 — entire half tappable */}
        <div
          className="flex-1 relative flex flex-col items-center justify-center gap-3 cursor-pointer"
          style={{ background: T2_BG }}
          onClick={() => doPoint(2)}
        >
          {flash?.team === 2 && (
            <FlashOverlay key={flash.key} />
          )}

          <span className="text-white/60 text-sm font-bold uppercase tracking-widest">Time 2</span>
          <span
            className="text-white font-black leading-none tabular-nums"
            style={{ fontSize: "clamp(96px, 30vw, 260px)" }}
          >
            {match.score2}
          </span>
          <span className="text-white/40 text-xs text-center px-4 leading-relaxed max-w-[160px]">
            {firstNames(match.team2)}
          </span>

          {isStarter && isLive && (
            <>
              <span className="text-white/25 text-xs mt-2">toque para pontuar</span>
              <button
                className="absolute bottom-6 right-4 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
                style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
                onClick={(e) => doUndo(e, 2)}
              >
                −1
              </button>
            </>
          )}
        </div>
      </div>

      {/* Winner banner */}
      {!isLive && winnerTeam && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div className="text-center">
            <div className="text-6xl mb-3">🏆</div>
            <div className="text-white text-3xl font-black">Time {match.winner} venceu!</div>
            <div className="text-white/50 text-base mt-2 font-medium">{match.score1} – {match.score2}</div>
          </div>
        </div>
      )}

      {/* End match dialog */}
      {endOpen && (
        <div
          className="absolute inset-0 z-40 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setEndOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
            style={{ background: "#1e1e1e" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-black text-center"
              style={{ fontFamily: "var(--font-nunito)", color: "#f2f2f2" }}
            >
              Quem venceu?
            </h3>
            <p className="text-center text-sm text-muted-foreground">
              Placar final: {match.score1} – {match.score2}
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-4 rounded-xl font-black text-white"
                style={{ background: T1_BG }}
                onClick={() => handleEnd(1)}
              >
                Time 1
                <div className="text-xs font-normal opacity-60 mt-0.5 truncate px-2">
                  {firstNames(match.team1)}
                </div>
              </button>
              <button
                className="flex-1 py-4 rounded-xl font-black text-white"
                style={{ background: T2_BG }}
                onClick={() => handleEnd(2)}
              >
                Time 2
                <div className="text-xs font-normal opacity-60 mt-0.5 truncate px-2">
                  {firstNames(match.team2)}
                </div>
              </button>
            </div>
            <button className="w-full py-2 text-sm text-muted-foreground" onClick={() => setEndOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FlashOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-none"
      style={{
        background: "rgba(255,255,255,0.18)",
        animation: "flash-fade 0.35s ease-out forwards",
      }}
    />
  );
}
