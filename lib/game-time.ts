import { parseISO } from "date-fns";

export type GameTimeStatus =
  | "open"         // pode entrar e sair
  | "closing_soon" // menos de 2h → não pode mais sair, mas ainda pode entrar
  | "closed"       // menos de 1h → não pode entrar nem sair
  | "finished";    // já passou do horário

// Todos os horários são interpretados em GMT-4 (Rondônia)
function gameDate(date: string, time: string): Date {
  return parseISO(`${date}T${time}-04:00`);
}

export function getGameTimeStatus(date: string, time: string): GameTimeStatus {
  const gameDateTime = gameDate(date, time);
  const diffHours = (gameDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (diffHours < 0) return "finished";
  if (diffHours < 1) return "closed";
  if (diffHours < 2) return "closing_soon";
  return "open";
}

export function canJoin(date: string, time: string, allowLate = false): boolean {
  const status = getGameTimeStatus(date, time);
  if (allowLate) return status !== "finished";
  return status === "open" || status === "closing_soon";
}

export function canLeave(date: string, time: string, allowEarlyLeave = false): boolean {
  const status = getGameTimeStatus(date, time);
  if (allowEarlyLeave) return status !== "finished";
  return status === "open";
}

// Janela de 48h: convidados adicionados dentro desse prazo entram direto; antes ficam em espera
export function isWithin48Hours(date: string, time: string): boolean {
  const hoursUntil = (gameDate(date, time).getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil <= 48;
}

// Retorna true enquanto o vôlei estiver acontecendo (entre o início e o fim)
export function isGameInProgress(date: string, time: string, durationHours: number): boolean {
  const start = gameDate(date, time);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const now = new Date();
  return now >= start && now <= end;
}
