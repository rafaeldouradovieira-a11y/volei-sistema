"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setChampionshipStage } from "@/app/campeonato/[id]/actions";
import { STAGES, STAGE_LABEL, type ChampionshipStage } from "@/lib/championship-stage";

interface Props {
  championshipId: string;
  stage: ChampionshipStage;
}

export function StageSelect({ championshipId, stage }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true);
    const res = await setChampionshipStage(championshipId, e.target.value);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.success);
      router.refresh();
    }
  }

  return (
    <select
      value={stage}
      onChange={handleChange}
      disabled={loading}
      aria-label="Etapa do campeonato"
      className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
      style={{
        background: "rgba(255,255,255,0.08)",
        color: "var(--color-lime)",
        fontFamily: "var(--font-syne)",
      }}
    >
      {STAGES.map((s, i) => (
        <option key={s} value={s} style={{ color: "black" }}>
          Etapa {i + 1}: {STAGE_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
