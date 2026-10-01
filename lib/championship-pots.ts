export interface PotCandidate {
  id: string;
  name: string | null;
  avatar_url: string | null;
  gender: "F" | "M" | null;
  joined_at: string;
}

export interface Vote {
  candidate_id: string;
  score: number;
}

export interface RankedPlayer extends PotCandidate {
  average: number | null;
  votes: number;
  fives: number;
}

export interface Pots {
  // inscritos sem gênero no perfil: ainda não entram em nenhum pote
  unassigned: PotCandidate[];
  girls: PotCandidate[];
  A: RankedPlayer[];
  B: RankedPlayer[];
  C: RankedPlayer[];
}

// Quem entra na votação e nos potes de homens: os homens.
// Quem ainda não preencheu o gênero fica de fora até completar o perfil.
export function isVotable(c: { gender: "F" | "M" | null }): boolean {
  return c.gender === "M";
}

// Ranking dos votáveis, do melhor pro pior. Sem sorteio — o desempate é sempre o mesmo:
//  1. maior média
//  2. mais votos recebidos (mais gente opinando = nota mais confiável)
//  3. mais notas 5
//  4. quem se inscreveu primeiro
// Quem não recebeu nenhuma nota fica depois de todos que receberam.
export function rankPlayers(candidates: PotCandidate[], votes: Vote[]): RankedPlayer[] {
  const stats = new Map<string, { sum: number; count: number; fives: number }>();
  for (const v of votes) {
    const s = stats.get(v.candidate_id) ?? { sum: 0, count: 0, fives: 0 };
    s.sum += v.score;
    s.count += 1;
    if (v.score === 5) s.fives += 1;
    stats.set(v.candidate_id, s);
  }

  return candidates
    .map((c) => {
      const s = stats.get(c.id);
      return {
        ...c,
        average: s ? s.sum / s.count : null,
        votes: s?.count ?? 0,
        fives: s?.fives ?? 0,
      };
    })
    .sort(
      (a, b) =>
        (b.average ?? -1) - (a.average ?? -1) ||
        b.votes - a.votes ||
        b.fives - a.fives ||
        new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    );
}

// Meninas num pote; homens ranqueados divididos em A (melhores), B e C.
// Se não dividir certinho, o que sobra vai primeiro pro A, depois pro B (ex.: 16 homens = 6/5/5).
export function buildPots(participants: PotCandidate[], votes: Vote[]): Pots {
  const girls = participants.filter((p) => p.gender === "F");
  const unassigned = participants.filter((p) => !p.gender);
  const ranked = rankPlayers(participants.filter(isVotable), votes);

  const base = Math.floor(ranked.length / 3);
  const extra = ranked.length % 3;
  const sizeA = base + (extra > 0 ? 1 : 0);
  const sizeB = base + (extra > 1 ? 1 : 0);

  return {
    unassigned,
    girls,
    A: ranked.slice(0, sizeA),
    B: ranked.slice(sizeA, sizeA + sizeB),
    C: ranked.slice(sizeA + sizeB),
  };
}

export interface DrawCheck {
  ok: boolean;
  teamCount: number;
  // por que não dá pra sortear (quando !ok)
  message: string | null;
}

// Cada time = 1 menina + 1 de cada pote de homens, então precisa de
// 1 menina e 3 homens por time (meninas = tamanho dos potes A, B e C).
export function checkDraw(pots: Pots): DrawCheck {
  const girls = pots.girls.length;
  const men = pots.A.length + pots.B.length + pots.C.length;
  if (girls === 0 || men === 0)
    return { ok: false, teamCount: 0, message: "Ainda não há meninas e homens suficientes para formar times." };
  if (girls * 3 !== men) {
    const needGirls = Math.ceil(men / 3);
    const msg =
      girls < needGirls
        ? `Faltam ${needGirls - girls} menina(s) para fechar os times`
        : `Sobram ${girls - needGirls} menina(s) ou faltam ${girls * 3 - men} homens`;
    return {
      ok: false,
      teamCount: 0,
      message: `${msg} (hoje: ${girls} meninas e ${men} homens — cada time leva 1 menina e 3 homens).`,
    };
  }
  return { ok: true, teamCount: girls, message: null };
}
