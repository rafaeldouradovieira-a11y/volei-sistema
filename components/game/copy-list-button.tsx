"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  gameId: string;
  title: string;
  dayOfWeek: string;
  dateShort: string;
  location: string;
  court: string | null;
  startHour: number;
  endHour: number;
  maxPlayers: number;
  players: { name: string }[];
}

export function CopyListButton({ gameId, title, dayOfWeek, dateShort, location, court, startHour, endHour, maxPlayers, players }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const headerLine = `${title} ${dayOfWeek} ${dateShort}`;
    const locationLine = `${location}${court ? ` ${court}` : ""} - ${startHour}h às ${endHour}h`;
    const playerLines = players.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const link = `${window.location.origin}/games/${gameId}`;
    const text = `${headerLine}\n${locationLine}\n\n${playerLines}\n\n${players.length}/${maxPlayers}\n${link}`;

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
