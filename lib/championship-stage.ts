export const STAGES = ["registration", "voting", "draw", "table", "games"] as const;
export type ChampionshipStage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<ChampionshipStage, string> = {
  registration: "Inscrição",
  voting: "Votação",
  draw: "Sorteio",
  table: "Tabela",
  games: "Jogos",
};

export function isStage(value: string): value is ChampionshipStage {
  return (STAGES as readonly string[]).includes(value);
}
