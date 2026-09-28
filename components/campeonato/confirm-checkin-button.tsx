"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { confirmChampionshipParticipantPayment } from "@/app/campeonato/[id]/actions";

interface Props {
  championshipId: string;
  participantId: string;
}

export function ConfirmCheckinButton({ championshipId, participantId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await confirmChampionshipParticipantPayment(championshipId, participantId);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else { toast.success(result.success); router.refresh(); }
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      title="Confirmar inscrição"
      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
      style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
    >
      <CheckCircle size={11} />
      {loading ? "..." : "Confirmar"}
    </button>
  );
}
