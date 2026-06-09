import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { GameActions } from "@/components/game/game-actions";
import type { GameWithDetails } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG = {
  active:    { label: "Ativo",      bg: "#c4ff45", color: "#0c2b1a" },
  closed:    { label: "Encerrado",  bg: "#e5e5e5", color: "#525252" },
  cancelled: { label: "Cancelado",  bg: "#fecaca", color: "#7f1d1d" },
};

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("games")
    .select(`*, profiles(*), game_participants(*, profiles(*)), waiting_list(*, profiles(*))`)
    .eq("id", id)
    .single();

  if (!data) notFound();

  const game = data as GameWithDetails;
  const participantCount = game.game_participants.length;
  const confirmedCount = game.game_participants.filter(
    (p) => p.payment_status === "confirmed"
  ).length;
  const pricePerPerson =
    game.price_total && participantCount > 0
      ? (game.price_total / participantCount).toFixed(2)
      : null;

  const fillPct = Math.min((participantCount / game.max_players) * 100, 100);

  const dayStr = format(parseISO(game.date), "EEEE", { locale: ptBR });
  const dateStr = format(parseISO(game.date), "dd 'de' MMMM", { locale: ptBR });

  const status = STATUS_CONFIG[game.status];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Hero header */}
      <div style={{ background: "var(--color-brand)" }}>
        {/* Nav bar */}
        <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center gap-3">
          <Link href="/">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <ArrowLeft size={16} />
            </button>
          </Link>
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-syne)" }}
          >
            Detalhe do jogo
          </span>
        </div>

        {/* Game info */}
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1
              className="text-2xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "white" }}
            >
              {game.title || game.location.toUpperCase()}
            </h1>
            <span
              className="shrink-0 text-xs font-bold px-3 py-1 rounded-full mt-1"
              style={{
                background: status.bg,
                color: status.color,
                fontFamily: "var(--font-syne)",
              }}
            >
              {status.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            <span className="capitalize">{dayStr}, {dateStr}</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {game.time.slice(0, 5)} · {game.duration_hours}h
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {game.location}
              {game.court ? ` · ${game.court}` : ""}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>
              por {game.profiles.name.split(" ")[0]}
            </span>
          </div>

          {/* Scoreboard row */}
          <div
            className="rounded-2xl p-4 flex items-center justify-between gap-4"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            {/* Player count */}
            <div>
              <div
                className="text-4xl font-extrabold leading-none"
                style={{
                  fontFamily: "var(--font-syne)",
                  color: "var(--color-lime)",
                }}
              >
                {participantCount}
                <span className="text-2xl opacity-40">/{game.max_players}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                jogadores
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 space-y-1.5">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${fillPct}%`,
                    background:
                      fillPct >= 100
                        ? "#f87171"
                        : "var(--color-lime)",
                  }}
                />
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {game.max_players - participantCount > 0
                  ? `${game.max_players - participantCount} vagas restantes`
                  : "Lotado"}
              </div>
            </div>

            {/* Price */}
            {pricePerPerson && (
              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-extrabold leading-none"
                  style={{ fontFamily: "var(--font-syne)", color: "white" }}
                >
                  R${pricePerPerson}
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                  por pessoa
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Actions */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <GameActions game={game} currentUserId={user?.id ?? null} />
        </div>

        {/* Participant list */}
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-bold tracking-wide uppercase"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              Lista de jogadores
            </h3>
            {game.price_total && participantCount > 0 && (
              <span className="text-xs text-muted-foreground">
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-brand)" }}
                >
                  {confirmedCount}
                </span>
                /{participantCount} pagos
              </span>
            )}
          </div>

          {participantCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum participante ainda
            </p>
          ) : (
            <div className="space-y-0.5">
              {game.game_participants.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-2.5 rounded-lg px-2 -mx-2 transition-colors hover:bg-muted/50"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "var(--color-brand)",
                      color: "var(--color-lime)",
                      fontFamily: "var(--font-syne)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{p.profiles.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {p.profiles.phone}
                    </span>
                  </div>
                  {game.price_total && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={
                        p.payment_status === "confirmed"
                          ? {
                              background: "#c4ff45",
                              color: "#0c2b1a",
                              fontFamily: "var(--font-syne)",
                            }
                          : {
                              background: "#fef3c7",
                              color: "#92400e",
                              fontFamily: "var(--font-syne)",
                            }
                      }
                    >
                      {p.payment_status === "confirmed" ? "Pago" : "Pendente"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Waiting list */}
          {game.waiting_list.length > 0 && (
            <>
              <div
                className="my-4 flex items-center gap-2"
              >
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                <span
                  className="text-xs font-semibold uppercase tracking-widest px-2"
                  style={{ fontFamily: "var(--font-syne)", color: "oklch(0.7 0.08 55)" }}
                >
                  Lista de espera
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              </div>
              <div className="space-y-0.5">
                {game.waiting_list.map((w, i) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 py-2.5 rounded-lg px-2 -mx-2"
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 opacity-50"
                      style={{
                        border: "1.5px dashed oklch(0.7 0.08 55)",
                        color: "oklch(0.7 0.08 55)",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-muted-foreground">
                        {w.profiles.name}
                      </span>
                      <span className="text-muted-foreground/50 text-xs ml-2">
                        {w.profiles.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
