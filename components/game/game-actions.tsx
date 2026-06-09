"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, CheckCircle, Clock, UserPlus, LogOut, AlertCircle } from "lucide-react";
import {
  joinGame,
  leaveGame,
  leaveWaitingList,
  confirmPayment,
  confirmParticipantPayment,
  closeGame,
  cancelGame,
} from "@/app/games/[id]/actions";
import type { GameWithDetails } from "@/lib/supabase/types";
import { canJoin, canLeave, getGameTimeStatus } from "@/lib/game-time";

interface GameActionsProps {
  game: GameWithDetails;
  currentUserId: string | null;
}

export function GameActions({ game, currentUserId }: GameActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const isOrganizer = currentUserId === game.organizer_id;
  const participant = game.game_participants.find((p) => p.user_id === currentUserId);
  const inWaitingList = game.waiting_list.find((w) => w.user_id === currentUserId);
  const timeStatus = getGameTimeStatus(game.date, game.time);
  const gameIsFull = game.game_participants.length >= game.max_players;

  async function handle(
    action: () => Promise<{ error?: string; success?: string }>,
    key: string
  ) {
    setLoading(key);
    try {
      const result = await action();
      if (result.error) toast.error(result.error);
      else if (result.success) toast.success(result.success);
    } finally {
      setLoading(null);
    }
  }

  if (!currentUserId) {
    return (
      <ActionBtn
        onClick={() => router.push(`/auth?redirect=/games/${game.id}`)}
        variant="primary"
      >
        <UserPlus size={15} />
        Entrar para participar
      </ActionBtn>
    );
  }

  return (
    <div className="space-y-2">
      {/* Participante: sair */}
      {participant && game.status === "active" && (
        <>
          {canLeave(game.date, game.time) ? (
            <ActionBtn
              variant="ghost-danger"
              disabled={loading === "leave"}
              onClick={() => handle(() => leaveGame(game.id), "leave")}
            >
              <LogOut size={15} />
              {loading === "leave" ? "Saindo..." : "Retirar meu nome"}
            </ActionBtn>
          ) : (
            <InfoBanner
              icon={<Clock size={14} />}
              color="amber"
              text={
                timeStatus === "closed" || timeStatus === "finished"
                  ? "Vôlei fechado — você está confirmado!"
                  : "Faltam menos de 2h — não é mais possível sair"
              }
            />
          )}
        </>
      )}

      {/* Participante: pagar */}
      {participant && (
        <PaymentSection
          game={game}
          paymentStatus={participant.payment_status}
          loading={loading}
          onConfirm={() => handle(() => confirmPayment(game.id), "pay")}
        />
      )}

      {/* Não participante: entrar */}
      {!participant && !inWaitingList && game.status === "active" && (
        <>
          {canJoin(game.date, game.time) ? (
            <ActionBtn
              variant="primary"
              disabled={loading === "join"}
              onClick={() => handle(() => joinGame(game.id), "join")}
            >
              <UserPlus size={15} />
              {loading === "join"
                ? "Entrando..."
                : gameIsFull
                ? "Entrar na lista de espera"
                : "Colocar meu nome na lista"}
            </ActionBtn>
          ) : (
            <InfoBanner
              icon={<Clock size={14} />}
              color="gray"
              text="Inscrições encerradas (menos de 1h para o jogo)"
            />
          )}
        </>
      )}

      {/* Lista de espera */}
      {inWaitingList && game.status === "active" && (
        <div className="space-y-2">
          <InfoBanner
            icon={<Clock size={14} />}
            color="amber"
            text="Você está na lista de espera"
          />
          {canLeave(game.date, game.time) && (
            <ActionBtn
              variant="ghost"
              disabled={loading === "leave-wait"}
              onClick={() => handle(() => leaveWaitingList(game.id), "leave-wait")}
            >
              Sair da lista de espera
            </ActionBtn>
          )}
        </div>
      )}

      {/* Organizador */}
      {isOrganizer && game.status === "active" && (
        <OrganizerActions
          game={game}
          loading={loading}
          onClose={() => handle(() => closeGame(game.id), "close")}
          onCancel={() => handle(() => cancelGame(game.id), "cancel")}
          onConfirmPayment={(participantId) =>
            handle(() => confirmParticipantPayment(game.id, participantId), `pay-${participantId}`)
          }
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function ActionBtn({
  children,
  variant = "primary",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "ghost-danger" | "outline";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--color-brand)",
      color: "var(--color-lime)",
    },
    ghost: {
      background: "oklch(0.93 0.01 85)",
      color: "var(--color-brand)",
    },
    "ghost-danger": {
      background: "#fff1f2",
      color: "#be123c",
    },
    outline: {
      background: "transparent",
      color: "var(--color-brand)",
      border: "1.5px solid var(--color-brand)",
    },
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
      style={{
        fontFamily: "var(--font-syne)",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

function InfoBanner({
  icon,
  color,
  text,
}: {
  icon: React.ReactNode;
  color: "amber" | "gray" | "green";
  text: string;
}) {
  const colorMap = {
    amber: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    gray: { bg: "#f9fafb", border: "#e5e7eb", color: "#6b7280" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
  };
  const c = colorMap[color];

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

function PaymentSection({
  game,
  paymentStatus,
  loading,
  onConfirm,
}: {
  game: GameWithDetails;
  paymentStatus: string;
  loading: string | null;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const participantCount = game.game_participants.length;
  const pricePerPerson =
    game.price_total && participantCount > 0
      ? (game.price_total / participantCount).toFixed(2)
      : null;

  if (!game.pix_key && !pricePerPerson) return null;

  if (paymentStatus === "confirmed") {
    return (
      <InfoBanner
        icon={<CheckCircle size={14} />}
        color="green"
        text="Pagamento confirmado"
      />
    );
  }

  return (
    <>
      <ActionBtn
        variant="outline"
        onClick={() => setOpen(true)}
      >
        Pagar vôlei
        {pricePerPerson && (
          <span
            className="ml-1 px-2 py-0.5 rounded-full text-xs"
            style={{ background: "var(--color-lime)", color: "var(--color-brand)" }}
          >
            R$ {pricePerPerson}
          </span>
        )}
      </ActionBtn>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>
              Faça o PIX e confirme aqui embaixo
            </DialogDescription>
          </DialogHeader>

          {pricePerPerson && (
            <div className="text-center py-4">
              <div
                className="text-5xl font-extrabold"
                style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
              >
                R$ {pricePerPerson}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total R$ {game.price_total} ÷ {participantCount} pessoas
              </div>
            </div>
          )}

          {game.pix_key && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: "oklch(0.93 0.01 85)" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
              >
                Chave PIX
              </div>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 text-sm break-all"
                  style={{ color: "var(--color-brand)" }}
                >
                  {game.pix_key}
                </code>
                <button
                  className="p-2 rounded-lg transition-colors hover:bg-muted"
                  onClick={() => {
                    navigator.clipboard.writeText(game.pix_key!);
                    toast.success("Chave copiada!");
                  }}
                  style={{ color: "var(--color-brand)" }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          <ActionBtn
            variant="primary"
            disabled={loading === "pay"}
            onClick={() => { setOpen(false); onConfirm(); }}
          >
            <CheckCircle size={15} />
            {loading === "pay" ? "Confirmando..." : "Confirmar que paguei"}
          </ActionBtn>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrganizerActions({
  game,
  loading,
  onClose,
  onCancel,
  onConfirmPayment,
}: {
  game: GameWithDetails;
  loading: string | null;
  onClose: () => void;
  onCancel: () => void;
  onConfirmPayment: (participantId: string) => void;
}) {
  const [showClose, setShowClose] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const pendingPayments = game.game_participants.filter(
    (p) => p.payment_status === "pending"
  );

  return (
    <>
      <div
        className="pt-3 mt-1 space-y-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)", opacity: 0.5 }}
        >
          Organizador
        </p>

        {/* Pending payments */}
        {pendingPayments.length > 0 && (
          <div className="space-y-1.5">
            {pendingPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm rounded-xl px-3 py-2.5"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
              >
                <span style={{ color: "#92400e" }}>
                  {p.profiles.name.split(" ")[0]} · pendente
                </span>
                <button
                  className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
                  style={{
                    background: "var(--color-brand)",
                    color: "var(--color-lime)",
                    fontFamily: "var(--font-syne)",
                  }}
                  disabled={loading === `pay-${p.id}`}
                  onClick={() => onConfirmPayment(p.id)}
                >
                  <CheckCircle size={11} />
                  {loading === `pay-${p.id}` ? "..." : "Confirmar"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <ActionBtn
            variant="primary"
            onClick={() => setShowClose(true)}
          >
            Encerrar jogo
          </ActionBtn>
          <button
            className="shrink-0 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
            style={{
              background: "#fff1f2",
              color: "#be123c",
              fontFamily: "var(--font-syne)",
            }}
            onClick={() => setShowCancel(true)}
          >
            <AlertCircle size={15} />
          </button>
        </div>
      </div>

      {/* Encerrar dialog */}
      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar jogo?</DialogTitle>
            <DialogDescription>
              O jogo será marcado como encerrado e ninguém mais poderá entrar ou sair.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <ActionBtn variant="ghost" onClick={() => setShowClose(false)}>
              Voltar
            </ActionBtn>
            <ActionBtn
              variant="primary"
              disabled={loading === "close"}
              onClick={() => { setShowClose(false); onClose(); }}
            >
              {loading === "close" ? "Encerrando..." : "Encerrar"}
            </ActionBtn>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancelar dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar jogo?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O jogo será marcado como cancelado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <ActionBtn variant="ghost" onClick={() => setShowCancel(false)}>
              Voltar
            </ActionBtn>
            <button
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-50"
              style={{
                background: "#be123c",
                color: "white",
                fontFamily: "var(--font-syne)",
              }}
              disabled={loading === "cancel"}
              onClick={() => { setShowCancel(false); onCancel(); }}
            >
              {loading === "cancel" ? "Cancelando..." : "Cancelar jogo"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
