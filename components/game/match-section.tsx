"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Trophy, ChevronRight, Mic2, Trash2, Pencil } from "lucide-react";
import { startMatch } from "@/app/games/[id]/actions";
import { deleteMatch, editMatch } from "@/app/match/[id]/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Match } from "@/lib/supabase/types";

export type MatchWithStarter = Match & { starterName: string | null };

interface Props {
  gameId: string;
  isParticipant: boolean;
  isAdmin?: boolean;
  liveMatch: MatchWithStarter | null;
  todayMatches: MatchWithStarter[];
}

const T1_BG = "#1d4ed8";
const T2_BG = "#dc2626";

export function MatchSection({ gameId, isParticipant, isAdmin = false, liveMatch, todayMatches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingMatch, setEditingMatch] = useState<MatchWithStarter | null>(null);

  function handleStart() {
    startTransition(async () => {
      const res = await startMatch(gameId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Partida iniciada!");
      router.push(`/match/${res.matchId}`);
    });
  }

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
        {!liveMatch && (
          (isParticipant || isAdmin) ? (
            <button
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
              onClick={handleStart}
            >
              <Play size={15} />
              {isPending ? "Iniciando..." : "Nova partida"}
            </button>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-2">
              Apenas participantes podem iniciar uma partida
            </p>
          )
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
                <div className="flex items-center justify-between px-1">
                  {m.starterName ? (
                    <div className="flex items-center gap-1.5">
                      <Mic2 size={10} color="#8e8e93" />
                      <span className="text-xs text-muted-foreground">
                        {m.starterName.split(" ")[0]}
                      </span>
                    </div>
                  ) : <span />}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingMatch(m); }}
                        className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:opacity-70"
                        style={{ color: "var(--color-brand)" }}
                        title="Editar partida"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Excluir esta partida?")) return;
                          const res = await deleteMatch(m.id, gameId);
                          if ("error" in res && res.error) toast.error(res.error);
                          else { toast.success("Partida excluída"); router.refresh(); }
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:opacity-70"
                        style={{ color: "#f87171" }}
                        title="Excluir partida"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit match dialog */}
        {editingMatch && (
          <EditMatchDialog
            match={editingMatch}
            gameId={gameId}
            onClose={() => setEditingMatch(null)}
            onSaved={() => { setEditingMatch(null); router.refresh(); }}
          />
        )}

        {!liveMatch && todayMatches.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-1">Nenhuma partida hoje</p>
        )}
      </div>
    </div>
  );
}

function EditMatchDialog({
  match,
  gameId,
  onClose,
  onSaved,
}: {
  match: MatchWithStarter;
  gameId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [score1, setScore1] = useState(match.score1);
  const [score2, setScore2] = useState(match.score2);
  const [winner, setWinner] = useState<1 | 2>((match.winner as 1 | 2) ?? 1);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await editMatch(match.id, gameId, score1, score2, winner);
    setSaving(false);
    if ("error" in res && res.error) toast.error(res.error);
    else { toast.success("Partida atualizada"); onSaved(); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar partida</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-1">
          {/* Scores */}
          <div className="flex items-center gap-4">
            <ScoreInput label="Time 1" value={score1} onChange={setScore1} color={T1_BG} />
            <span className="text-muted-foreground font-bold text-lg">×</span>
            <ScoreInput label="Time 2" value={score2} onChange={setScore2} color={T2_BG} />
          </div>

          {/* Winner */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}>
              Vencedor
            </p>
            <div className="flex gap-2">
              {([1, 2] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setWinner(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    fontFamily: "var(--font-syne)",
                    background: winner === t ? (t === 1 ? T1_BG : T2_BG) : "rgba(255,255,255,0.06)",
                    color: winner === t ? "white" : "#8e8e93",
                  }}
                >
                  Time {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: "#e5e5e5", fontFamily: "var(--font-syne)" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScoreInput({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full font-bold text-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", color: "#e5e5e5" }}
        >−</button>
        <span className="text-2xl font-extrabold w-8 text-center" style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full font-bold text-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", color: "#e5e5e5" }}
        >+</button>
      </div>
    </div>
  );
}
