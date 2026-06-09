"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, CheckCircle, XCircle, LogOut, UserPlus, Clock } from "lucide-react";
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
  const participant = game.game_participants.find(
    (p) => p.user_id === currentUserId
  );
  const inWaitingList = game.waiting_list.find(
    (w) => w.user_id === currentUserId
  );
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
      <Button
        className="w-full"
        onClick={() => router.push(`/auth?redirect=/games/${game.id}`)}
      >
        Entrar para participar
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {participant && game.status === "active" && (
        <>
          {canLeave(game.date, game.time) ? (
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              disabled={loading === "leave"}
              onClick={() => handle(() => leaveGame(game.id), "leave")}
            >
              <LogOut size={15} />
              {loading === "leave" ? "Saindo..." : "Retirar meu nome"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <Clock size={14} />
              {timeStatus === "closed" || timeStatus === "finished"
                ? "Vôlei fechado — você está confirmado!"
                : "Faltam menos de 2h — você não pode mais sair"}
            </div>
          )}
        </>
      )}

      {participant && (
        <PaymentSection
          game={game}
          paymentStatus={participant.payment_status}
          loading={loading}
          onConfirm={() => handle(() => confirmPayment(game.id), "pay")}
        />
      )}

      {!participant && !inWaitingList && game.status === "active" && (
        <>
          {canJoin(game.date, game.time) ? (
            <Button
              className="w-full"
              disabled={loading === "join"}
              onClick={() => handle(() => joinGame(game.id), "join")}
            >
              <UserPlus size={15} />
              {loading === "join"
                ? "Entrando..."
                : gameIsFull
                ? "Entrar na lista de espera"
                : "Colocar meu nome na lista"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-md px-3 py-2">
              <Clock size={14} />
              Vôlei fechado para novas inscrições (menos de 1h para o jogo)
            </div>
          )}
        </>
      )}

      {inWaitingList && game.status === "active" && (
        <div className="space-y-2">
          <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2 text-center">
            Você está na lista de espera
          </div>
          {canLeave(game.date, game.time) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-gray-600"
              disabled={loading === "leave-wait"}
              onClick={() =>
                handle(() => leaveWaitingList(game.id), "leave-wait")
              }
            >
              Sair da lista de espera
            </Button>
          )}
        </div>
      )}

      {isOrganizer && game.status === "active" && (
        <OrganizerActions
          game={game}
          loading={loading}
          onClose={() => handle(() => closeGame(game.id), "close")}
          onCancel={() => handle(() => cancelGame(game.id), "cancel")}
          onConfirmPayment={(participantId) =>
            handle(
              () => confirmParticipantPayment(game.id, participantId),
              `pay-${participantId}`
            )
          }
        />
      )}
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
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        <CheckCircle size={14} />
        Pagamento confirmado
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full text-green-700 border-green-300"
        onClick={() => setOpen(true)}
      >
        Pagar vôlei
        {pricePerPerson && (
          <span className="ml-1 font-bold">· R$ {pricePerPerson}</span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>
              Faça o PIX e confirme aqui embaixo
            </DialogDescription>
          </DialogHeader>
          {pricePerPerson && (
            <div className="text-center py-2">
              <div className="text-3xl font-bold">R$ {pricePerPerson}</div>
              <div className="text-sm text-gray-500 mt-1">
                Total R$ {game.price_total} ÷ {participantCount} pessoas
              </div>
            </div>
          )}
          {game.pix_key && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="text-sm text-gray-500">Chave PIX</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono break-all">
                  {game.pix_key}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(game.pix_key!);
                    toast.success("Chave copiada!");
                  }}
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              disabled={loading === "pay"}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              <CheckCircle size={15} />
              {loading === "pay" ? "Confirmando..." : "Confirmar que paguei"}
            </Button>
          </DialogFooter>
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

  const pendingCount = game.game_participants.filter(
    (p) => p.payment_status === "pending"
  ).length;

  return (
    <>
      <div className="border-t pt-3 mt-3 space-y-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          Organizador
        </p>

        {pendingCount > 0 && (
          <div className="space-y-1">
            {game.game_participants
              .filter((p) => p.payment_status === "pending")
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-1.5"
                >
                  <span>{p.profiles.name.split(" ")[0]}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-green-700"
                    disabled={loading === `pay-${p.id}`}
                    onClick={() => onConfirmPayment(p.id)}
                  >
                    <CheckCircle size={12} />
                    {loading === `pay-${p.id}` ? "..." : "Confirmar"}
                  </Button>
                </div>
              ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => setShowClose(true)}
          >
            Encerrar jogo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200"
            onClick={() => setShowCancel(true)}
          >
            <XCircle size={14} />
            Cancelar
          </Button>
        </div>
      </div>

      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar jogo?</DialogTitle>
            <DialogDescription>
              O jogo será marcado como encerrado e ninguém mais poderá entrar
              ou sair.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClose(false)}>
              Voltar
            </Button>
            <Button
              disabled={loading === "close"}
              onClick={() => {
                setShowClose(false);
                onClose();
              }}
            >
              {loading === "close" ? "Encerrando..." : "Encerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar jogo?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O jogo será marcado como
              cancelado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={loading === "cancel"}
              onClick={() => {
                setShowCancel(false);
                onCancel();
              }}
            >
              {loading === "cancel" ? "Cancelando..." : "Cancelar jogo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
