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
import { Copy, CheckCircle, Clock, UserPlus, LogOut, AlertCircle, UserRoundPlus, X } from "lucide-react";
import {
  joinGame,
  leaveGame,
  leaveWaitingList,
  confirmPayment,
  confirmParticipantPayment,
  addGuest,
  removeGuest,
  confirmGuestPayment,
  closeGame,
  cancelGame,
  saveProof,
} from "@/app/games/[id]/actions";
import { createClient } from "@/lib/supabase/client";
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
  const totalOccupied = game.game_participants.length + game.game_guests.length;
  const gameIsFull = totalOccupied >= game.max_players;
  const myGuests = game.game_guests.filter((g) => g.invited_by === currentUserId);

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
          proofUrl={participant.proof_url ?? null}
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

      {/* Adicionar convidado */}
      {participant && game.status === "active" && canJoin(game.date, game.time) && !gameIsFull && (
        <AddGuestButton
          gameId={game.id}
          loading={loading}
          onAdd={(name) => handle(() => addGuest(game.id, name), "add-guest")}
        />
      )}

      {/* Meus convidados */}
      {myGuests.length > 0 && game.status === "active" && (
        <div className="space-y-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-widest px-1"
            style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)", opacity: 0.5 }}
          >
            Meus convidados
          </p>
          {myGuests.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <span className="font-medium" style={{ color: "var(--color-brand)" }}>
                {g.name}
              </span>
              {canLeave(game.date, game.time) && (
                <button
                  disabled={loading === `rm-guest-${g.id}`}
                  onClick={() => handle(() => removeGuest(g.id, game.id), `rm-guest-${g.id}`)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-red-100 disabled:opacity-50"
                  style={{ color: "#be123c" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
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
          onConfirmGuestPayment={(guestId) =>
            handle(() => confirmGuestPayment(guestId, game.id), `gpay-${guestId}`)
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
      background: "rgba(255,255,255,0.06)",
      color: "#f2f2f2",
    },
    "ghost-danger": {
      background: "rgba(239,68,68,0.12)",
      color: "#f87171",
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
    amber: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", color: "#fbbf24" },
    gray:  { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "#8e8e93" },
    green: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", color: "#34d399" },
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
  proofUrl,
  loading,
  onConfirm,
}: {
  game: GameWithDetails;
  paymentStatus: string;
  proofUrl: string | null;
  loading: string | null;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const participantCount = game.game_participants.length + game.game_guests.length;
  const pricePerPerson =
    game.price_total && participantCount > 0
      ? (game.price_total / participantCount).toFixed(2)
      : null;

  if (!game.pix_key && !pricePerPerson) return null;

  async function handleUploadProof() {
    if (!proofFile) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = proofFile.name.split(".").pop() ?? "jpg";
      const path = `${game.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("proofs")
        .upload(path, proofFile, { upsert: true });
      if (upErr) { toast.error("Erro ao enviar comprovante"); return; }
      const { data: { publicUrl } } = supabase.storage.from("proofs").getPublicUrl(path);
      const res = await saveProof(game.id, publicUrl);
      if (res.error) toast.error(res.error);
      else toast.success("Comprovante enviado!");
      setProofFile(null);
    } finally {
      setUploading(false);
    }
  }

  if (paymentStatus === "confirmed") {
    return (
      <div className="space-y-2">
        <InfoBanner
          icon={<CheckCircle size={14} />}
          color="green"
          text="Pagamento confirmado"
        />
        {proofUrl && (
          <a
            href={proofUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-center underline text-muted-foreground"
          >
            Ver comprovante enviado
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <ActionBtn variant="outline" onClick={() => setOpen(true)}>
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
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
              >
                Chave PIX
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm break-all" style={{ color: "var(--color-brand)" }}>
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

          {/* Proof upload */}
          <div className="space-y-2">
            <label
              className="block text-xs font-semibold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              Comprovante (opcional)
            </label>
            <div className="flex gap-2">
              <label
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors hover:opacity-80"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--color-brand)",
                  border: proofFile ? "1.5px solid var(--color-brand)" : "1.5px dashed #ccc",
                  fontFamily: "var(--font-syne)",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                {proofFile ? proofFile.name.slice(0, 20) : "Anexar imagem"}
              </label>
              {proofFile && (
                <button
                  disabled={uploading}
                  onClick={handleUploadProof}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50"
                  style={{
                    background: "var(--color-brand)",
                    color: "var(--color-lime)",
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {uploading ? "..." : "Enviar"}
                </button>
              )}
            </div>
            {proofUrl && !proofFile && (
              <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs underline text-muted-foreground">
                Comprovante já enviado — ver
              </a>
            )}
          </div>

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

function AddGuestButton({
  gameId,
  loading,
  onAdd,
}: {
  gameId: string;
  loading: string | null;
  onAdd: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    setOpen(false);
  }

  return (
    <>
      <ActionBtn variant="outline" onClick={() => setOpen(true)}>
        <UserRoundPlus size={15} />
        Adicionar convidado
      </ActionBtn>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar convidado</DialogTitle>
            <DialogDescription>
              O convidado aparece na lista vinculado ao seu nome.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <label
                className="block text-xs font-semibold tracking-widest uppercase"
                style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
              >
                Nome do convidado
              </label>
              <div className="field-input" style={{ borderBottom: "2px solid var(--color-brand)" }}>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <ActionBtn variant="primary" disabled={loading === "add-guest"}>
              <UserRoundPlus size={15} />
              {loading === "add-guest" ? "Adicionando..." : "Adicionar"}
            </ActionBtn>
          </form>
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
  onConfirmGuestPayment,
}: {
  game: GameWithDetails;
  loading: string | null;
  onClose: () => void;
  onCancel: () => void;
  onConfirmPayment: (participantId: string) => void;
  onConfirmGuestPayment: (guestId: string) => void;
}) {
  const [showClose, setShowClose] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const pendingPayments = game.game_participants.filter(
    (p) => p.payment_status === "pending"
  );
  const pendingGuestPayments = game.game_guests.filter(
    (g) => g.payment_status === "pending"
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

        {/* Pending payments — participants */}
        {(pendingPayments.length > 0 || pendingGuestPayments.length > 0) && (
          <div className="space-y-1.5">
            {pendingPayments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl px-3 py-2.5 space-y-2"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "#92400e" }}>
                    {(p.profiles.name ?? "Alguém").split(" ")[0]} · pendente
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
                {p.proof_url && (
                  <a
                    href={p.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs underline"
                    style={{ color: "#92400e" }}
                  >
                    Ver comprovante
                  </a>
                )}
              </div>
            ))}
            {pendingGuestPayments.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between text-sm rounded-xl px-3 py-2.5"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                <span style={{ color: "#92400e" }}>
                  {g.name}
                  <span className="opacity-60 ml-1 text-xs">(convidado) · pendente</span>
                </span>
                <button
                  className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
                  style={{
                    background: "var(--color-brand)",
                    color: "var(--color-lime)",
                    fontFamily: "var(--font-syne)",
                  }}
                  disabled={loading === `gpay-${g.id}`}
                  onClick={() => onConfirmGuestPayment(g.id)}
                >
                  <CheckCircle size={11} />
                  {loading === `gpay-${g.id}` ? "..." : "Confirmar"}
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
              background: "rgba(239,68,68,0.12)",
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
