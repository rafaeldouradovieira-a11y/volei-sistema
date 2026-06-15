"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { removePlayerAsAdmin } from "@/app/games/[id]/actions";

interface Props {
  gameId: string;
  id: string;
  kind: "participant" | "guest";
  name: string;
}

export function RemovePlayerButton({ gameId, id, kind, name }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remover ${name} da lista?`)) return;
    setLoading(true);
    const result = await removePlayerAsAdmin(gameId, id, kind);
    setLoading(false);
    if ("error" in result && result.error) toast.error(result.error);
    else { toast.success("Participante removido"); router.refresh(); }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Remover da lista"
      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-70 active:scale-95 disabled:opacity-40"
      style={{ color: "#f87171" }}
    >
      <X size={13} />
    </button>
  );
}
