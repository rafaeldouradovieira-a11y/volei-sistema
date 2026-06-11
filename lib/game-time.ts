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

// Janela de 48h: convidados adicionados dentro desse prazo entram direto; antes ficam em espera
export function isWithin48Hours(date: string, time: string): boolean {
  const gameDateTime = parseISO(`${date}T${time}`);
  const hoursUntil = (gameDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil <= 48;
}

// Retorna true enquanto o vôlei estiver acontecendo (entre o início e o fim)
export function isGameInProgress(date: string, time: string, durationHours: number): boolean {
  const start = parseISO(`${date}T${time}`);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const now = new Date();
  return now >= start && now <= end;
}
