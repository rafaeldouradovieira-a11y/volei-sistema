"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { movePlayerToPot } from "@/app/campeonato/[id]/actions";

interface Props {
  championshipId: string;
  userId: string;
  pot: "A" | "B" | "C";
  moved: boolean;
}

export function PotMoveSelect({ championshipId, userId, pot, moved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setLoading(true);
    const res = await movePlayerToPot(
      championshipId,
      userId,
      value === "auto" ? null : (value as "A" | "B" | "C")
    );
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.success);
      router.refresh();
    }
  }

  return (
    <select
      value={pot}
      onChange={handleChange}
      disabled={loading}
      aria-label="Mover de pote"
      className="text-xs font-semibold rounded-lg px-2 py-1 disabled:opacity-50 shrink-0"
      style={{
        background: moved ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.08)",
        color: moved ? "#fbbf24" : "inherit",
        fontFamily: "var(--font-syne)",
      }}
    >
      {(["A", "B", "C"] as const).map((p) => (
        <option key={p} value={p} style={{ color: "black" }}>
          Pote {p}
        </option>
      ))}
      {moved && (
        <option value="auto" style={{ color: "black" }}>
          ↺ Voltar ao automático
        </option>
      )}
    </select>
  );
}
