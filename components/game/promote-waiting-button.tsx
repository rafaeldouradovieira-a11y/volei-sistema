"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";
import { promoteToPlayer } from "@/app/games/[id]/actions";

interface Props {
  gameId: string;
  id: string;
  kind: "participant" | "guest";
}

export function PromoteWaitingButton({ gameId, id, kind }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePromote() {
    setLoading(true);
    const result = await promoteToPlayer(gameId, id, kind);
    setLoading(false);
    if ("error" in result && result.error) toast.error(result.error);
    else { toast.success("Movido para a lista!"); router.refresh(); }
  }

  return (
    <button
      onClick={handlePromote}
      disabled={loading}
      title="Mover para lista de jogadores"
      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
      style={{
        background: "var(--color-brand)",
        color: "var(--color-lime)",
        fontFamily: "var(--font-syne)",
      }}
    >
      <ArrowUp size={11} />
      {loading ? "..." : "Promover"}
    </button>
  );
}
