"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPoint(matchId: string, team: 1 | 2) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const { data: match } = await supabase
    .from("matches")
    .select("started_by, score1, score2, status")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Partida não encontrada" };
  if (match.started_by !== user.id) return { error: "Apenas quem iniciou pode marcar pontos" };
  if (match.status !== "live") return { error: "Partida não está ativa" };

  const update = team === 1 ? { score1: match.score1 + 1 } : { score2: match.score2 + 1 };
  const { error } = await supabase.from("matches").update(update).eq("id", matchId);
  if (error) return { error: error.message };

  revalidatePath(`/match/${matchId}`);
  return { success: true };
}

export async function removePoint(matchId: string, team: 1 | 2) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const { data: match } = await supabase
    .from("matches")
    .select("started_by, score1, score2, status")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Partida não encontrada" };
  if (match.started_by !== user.id) return { error: "Apenas quem iniciou pode marcar pontos" };
  if (match.status !== "live") return { error: "Partida não está ativa" };

  const score = team === 1 ? Math.max(0, match.score1 - 1) : Math.max(0, match.score2 - 1);
  const update = team === 1 ? { score1: score } : { score2: score };
  const { error } = await supabase.from("matches").update(update).eq("id", matchId);
  if (error) return { error: error.message };

  revalidatePath(`/match/${matchId}`);
  return { success: true };
}

export async function endMatch(matchId: string, winner: 1 | 2) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const { data: match } = await supabase
    .from("matches")
    .select("started_by, team1, team2, status, game_id")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Partida não encontrada" };
  if (match.started_by !== user.id) return { error: "Apenas quem iniciou pode encerrar" };
  if (match.status !== "live") return { error: "Partida já encerrada" };

  const { error } = await supabase
    .from("matches")
    .update({ status: "finished", winner, ended_at: new Date().toISOString() })
    .eq("id", matchId);

  if (error) return { error: error.message };

  const winningTeam = (winner === 1 ? match.team1 : match.team2) as Array<{
    type: string; profile_id: string | null;
  }>;
  const winners = winningTeam.filter((p) => p.type === "participant" && p.profile_id);
  if (winners.length > 0) {
    await supabase.from("match_wins").insert(
      winners.map((p) => ({
        match_id: matchId,
        player_id: p.profile_id!,
        played_at: new Date().toISOString(),
      }))
    );
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/games/${match.game_id}`);
  return { success: "Partida encerrada!", gameId: match.game_id };
}
