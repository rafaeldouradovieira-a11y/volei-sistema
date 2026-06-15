"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  title: string;
  dayOfWeek: string;
  dateShort: string;
  location: string;
  court: string | null;
  startHour: number;
  endHour: number;
  players: { name: string }[];
}

export function CopyListButton({ title, dayOfWeek, dateShort, location, court, startHour, endHour, players }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const headerLine = `${title} ${dayOfWeek} ${dateShort}`;
    const locationLine = `${location}${court ? ` ${court}` : ""} - ${startHour}h às ${endHour}h`;
    const playerLines = players.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const text = `${headerLine}\n${locationLine}\n\n${playerLines}`;

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
