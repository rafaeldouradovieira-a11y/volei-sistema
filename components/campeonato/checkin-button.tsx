"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, LogOut } from "lucide-react";
import { checkinChampionship, leaveChampionship } from "@/app/campeonato/[id]/actions";

interface Props {
  championshipId: string;
  checkedIn: boolean;
}

export function CheckinButton({ championshipId, checkedIn }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = checkedIn
      ? await leaveChampionship(championshipId)
      : await checkinChampionship(championshipId);
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
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      style={{
        background: checkedIn ? "transparent" : "var(--color-brand)",
        color: checkedIn ? "#f87171" : "var(--color-lime)",
        border: checkedIn ? "1.5px solid rgba(248,113,113,0.4)" : "none",
        fontFamily: "var(--font-syne)",
      }}
    >
      {checkedIn ? <LogOut size={15} /> : <UserPlus size={15} />}
      {loading ? "..." : checkedIn ? "Sair da lista" : "Fazer check-in"}
    </button>
  );
}
