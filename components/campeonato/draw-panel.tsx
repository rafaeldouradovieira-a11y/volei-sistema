"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";
import { drawChampionshipTeams } from "@/app/campeonato/[id]/actions";

interface Props {
  championshipId: string;
  hasTeams: boolean;
  canDraw: boolean;
  problem: string | null;
  unassignedNames: string[];
}

const SYNE = { fontFamily: "var(--font-syne)" } as const;

export function DrawPanel({ championshipId, hasTeams, canDraw, problem, unassignedNames }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDraw() {
    const warnUnassigned = unassignedNames.length
      ? `\n\nFicarão de fora (perfil incompleto): ${unassignedNames.join(", ")}.`
      : "";
    const question = hasTeams
      ? "Sortear de novo? Os times atuais serão apagados."
      : "Sortear os times agora?";
    if (!window.confirm(question + warnUnassigned)) return;

    setLoading(true);
    const res = await drawChampionshipTeams(championshipId);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.success);
      router.refresh();
    }
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
      <h3
        className="text-sm font-bold tracking-wide uppercase"
        style={{ ...SYNE, color: "var(--color-brand)" }}
      >
        Sorteio (admin)
      </h3>

      {problem && (
        <p className="text-xs rounded-lg p-3" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
          {problem}
        </p>
      )}
      {unassignedNames.length > 0 && (
        <p className="text-xs rounded-lg p-3" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
          Perfil incompleto (fora dos potes): {unassignedNames.join(", ")}.
        </p>
      )}

      <button
        onClick={handleDraw}
        disabled={loading || !canDraw}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        style={{ background: "var(--color-brand)", color: "white", ...SYNE }}
      >
        <Shuffle size={15} />
        {loading ? "Sorteando..." : hasTeams ? "Sortear de novo" : "Sortear times"}
      </button>
    </div>
  );
}
