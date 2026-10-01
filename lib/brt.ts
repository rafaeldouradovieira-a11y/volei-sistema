// Datas/horários dos campeonatos são sempre no horário de Brasília,
// independente do fuso do servidor ou do navegador.
const TZ = "America/Sao_Paulo";

// "2026-10-14T18:00" (valor de <input type="datetime-local">) -> ISO com offset de Brasília
export function localInputToIso(local: string): string | null {
  if (!local) return null;
  return `${local}:00-03:00`;
}

function brtParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute") };
}

// ISO -> "2026-10-14T18:00" para preencher <input type="datetime-local">
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const p = brtParts(iso);
  return `${p.y}-${p.mo}-${p.d}T${p.h}:${p.mi}`;
}

// ISO -> "14/10 · 18h" (ou "14/10 · 18h30")
export function formatDateTimeBrt(iso: string | null): string | null {
  if (!iso) return null;
  const p = brtParts(iso);
  return `${p.d}/${p.mo} · ${p.h}h${p.mi === "00" ? "" : p.mi}`;
}

// "2026-10-07" -> "07/10"
export function formatDayMonth(date: string | null): string | null {
  if (!date) return null;
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}
