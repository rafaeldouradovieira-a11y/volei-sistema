import { parseISO } from "date-fns";

export type GameTimeStatus =
  | "open"         // pode entrar e sair
  | "closing_soon" // menos de 2h → não pode mais sair, mas ainda pode entrar
  | "closed"       // menos de 1h → não pode entrar nem sair
  | "finished";    // já passou do horário

export function getGameTimeStatus(date: string, time: string): GameTimeStatus {
  const gameDateTime = parseISO(`${date}T${time}`);
  const now = new Date();
  const diffMs = gameDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) return "finished";
  if (diffHours < 1) return "closed";
  if (diffHours < 2) return "closing_soon";
  return "open";
}

export function canJoin(date: string, time: string): boolean {
  const status = getGameTimeStatus(date, time);
  return status === "open" || status === "closing_soon";
}

export function canLeave(date: string, time: string): boolean {
  const status = getGameTimeStatus(date, time);
  return status === "open";
}
