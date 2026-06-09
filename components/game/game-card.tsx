import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock } from "lucide-react";
import type { GameWithDetails } from "@/lib/supabase/types";

interface GameCardProps {
  game: GameWithDetails;
}

const STATUS_CONFIG = {
  active_open:   { label: "Aberto",    bg: "#c4ff45", color: "#0c2b1a" },
  active_full:   { label: "Lotado",    bg: "#fbbf24", color: "#451a03" },
  closed:        { label: "Encerrado", bg: "#e5e5e5", color: "#525252" },
  cancelled:     { label: "Cancelado", bg: "#fecaca", color: "#7f1d1d" },
};

export function GameCard({ game }: GameCardProps) {
  const participantCount = game.game_participants.length;
  const isFull = participantCount >= game.max_players;
  const fillPct = Math.min((participantCount / game.max_players) * 100, 100);

  const statusKey =
    game.status === "active"
      ? isFull
        ? "active_full"
        : "active_open"
      : game.status === "cancelled"
      ? "cancelled"
      : "closed";

  const status = STATUS_CONFIG[statusKey];

  const dayStr = format(parseISO(game.date), "EEE", { locale: ptBR })
    .replace(".", "")
    .toUpperCase();
  const dateNum = format(parseISO(game.date), "dd");
  const monthStr = format(parseISO(game.date), "MMM", { locale: ptBR })
    .replace(".", "")
    .toUpperCase();

  const pricePerPerson =
    game.price_total && participantCount > 0
      ? (game.price_total / participantCount).toFixed(2)
      : null;

  return (
    <Link href={`/games/${game.id}`} className="block group">
      <div
        className="animate-in-card bg-card rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={{
          boxShadow: "0 1px 4px rgba(12,43,26,0.08)",
          borderLeft: "3px solid var(--color-lime)",
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div
              className="shrink-0 rounded-lg px-3 py-2 text-center min-w-[52px]"
              style={{
                background: "var(--color-brand)",
                color: "white",
              }}
            >
              <div className="text-xs opacity-60 font-medium tracking-widest">
                {dayStr}
              </div>
              <div
                className="text-2xl leading-none mt-0.5"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 800,
                  color: "var(--color-lime)",
                }}
              >
                {dateNum}
              </div>
              <div className="text-xs opacity-60 font-medium tracking-widest mt-0.5">
                {monthStr}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3
                  className="font-semibold text-[15px] leading-tight truncate"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {game.title || game.location}
                </h3>
                <span
                  className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: status.bg,
                    color: status.color,
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {game.time.slice(0, 5)} · {game.duration_hours}h
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={11} />
                  <span className="truncate">
                    {game.location}
                    {game.court ? ` · ${game.court}` : ""}
                  </span>
                </span>
              </div>

              {/* Player progress */}
              <div className="space-y-1.5">
                <div className="player-progress">
                  <div
                    className={`player-progress-fill ${isFull ? "full" : ""}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    <span
                      className="score-number text-sm"
                      style={{ color: "var(--color-brand)" }}
                    >
                      {participantCount}
                    </span>
                    <span className="text-muted-foreground">
                      /{game.max_players} jogadores
                    </span>
                    {game.waiting_list.length > 0 && (
                      <span className="ml-2 text-amber-600">
                        +{game.waiting_list.length} espera
                      </span>
                    )}
                  </span>
                  {pricePerPerson && (
                    <span
                      className="text-xs font-semibold"
                      style={{
                        fontFamily: "var(--font-syne)",
                        color: "var(--color-brand)",
                      }}
                    >
                      R$ {pricePerPerson}
                      <span className="font-normal text-muted-foreground">
                        /p
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organizer footer */}
        <div
          className="px-4 py-2 flex items-center justify-between text-xs"
          style={{
            borderTop: "1px solid var(--color-border)",
            background: "oklch(0.98 0.005 85)",
          }}
        >
          <span className="text-muted-foreground">
            organizado por{" "}
            <span style={{ color: "var(--color-brand)", fontWeight: 600 }}>
              {game.profiles.name.split(" ")[0]}
            </span>
          </span>
          <span
            style={{ color: "var(--color-lime)", fontSize: "16px" }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
