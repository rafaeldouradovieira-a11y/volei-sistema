"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  championshipId: string;
  players: { name: string | null }[];
}

export function CopyCheckinButton({ championshipId, players }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines = players.map((p, i) => `${i + 1}. ${p.name ?? "—"}`).join("\n");
    const link = `${window.location.origin}/campeonato/${championshipId}`;
    const text = `CHECKIN DO CAMPEONATO 🏆\n\n${lines}\n\n${link}`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold transition-all"
      style={{
        color: copied ? "#34d399" : "var(--color-brand)",
        fontFamily: "var(--font-syne)",
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado!" : "Copiar lista"}
    </button>
  );
}
