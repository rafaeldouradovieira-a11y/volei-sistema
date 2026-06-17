"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return data?.is_admin ?? false;
}

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
  const addIsAdmin = await isCurrentUserAdmin();
  if (!addIsAdmin && match.started_by !== user.id) return { error: "Apenas quem iniciou pode marcar pontos" };
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
  const removeIsAdmin = await isCurrentUserAdmin();
  if (!removeIsAdmin && match.started_by !== user.id) return { error: "Apenas quem iniciou pode marcar pontos" };
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
  const endIsAdmin = await isCurrentUserAdmin();
  if (!endIsAdmin && match.started_by !== user.id) return { error: "Apenas quem iniciou pode encerrar" };
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

export async function deleteMatch(matchId: string, gameId: string) {
  if (!(await isCurrentUserAdmin())) return { error: "Acesso negado" };
  const admin = createAdminClient();
  await admin.from("match_wins").delete().eq("match_id", matchId);
  const { error } = await admin.from("matches").delete().eq("id", matchId);
  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  return { success: "Partida excluída" };
}

export async function editMatch(
  matchId: string,
  gameId: string,
  score1: number,
  score2: number,
  winner: 1 | 2
) {
  if (!(await isCurrentUserAdmin())) return { error: "Acesso negado" };
  const admin = createAdminClient();

  const { data: match } = await admin
    .from("matches")
    .select("team1, team2, winner, ended_at")
    .eq("id", matchId)
    .single();
  if (!match) return { error: "Partida não encontrada" };

  const { error } = await admin
    .from("matches")
    .update({ score1, score2, winner })
    .eq("id", matchId);
  if (error) return { error: error.message };

  if (match.winner !== winner) {
    await admin.from("match_wins").delete().eq("match_id", matchId);
    const winningTeam = (winner === 1 ? match.team1 : match.team2) as Array<{
      type: string; profile_id: string | null;
    }>;
    const winners = winningTeam.filter((p) => p.type === "participant" && p.profile_id);
    if (winners.length > 0) {
      await admin.from("match_wins").insert(
        winners.map((p) => ({
          match_id: matchId,
          player_id: p.profile_id!,
          played_at: match.ended_at ?? new Date().toISOString(),
        }))
      );
    }
  }

  revalidatePath(`/games/${gameId}`);
  revalidatePath(`/match/${matchId}`);
  return { success: "Partida atualizada" };
}
