"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { closeChampionship, reopenChampionship } from "@/app/campeonato/[id]/actions";

interface Props {
  championshipId: string;
  status: "active" | "closed";
}

export function StatusButton({ championshipId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result =
      status === "active"
        ? await closeChampionship(championshipId)
        : await reopenChampionship(championshipId);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80 disabled:opacity-50"
      style={{
        background: "rgba(255,255,255,0.08)",
        color: "var(--color-lime)",
        fontFamily: "var(--font-syne)",
      }}
    >
      {loading ? "..." : status === "active" ? "Encerrar campeonato" : "Reabrir campeonato"}
    </button>
  );
}
