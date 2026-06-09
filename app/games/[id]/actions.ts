"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { canJoin, canLeave } from "@/lib/game-time";

export async function joinGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("*, game_participants(id)")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Jogo não encontrado" };
  if (game.status !== "active") return { error: "Este jogo não está ativo" };
  if (!canJoin(game.date, game.time))
    return { error: "Não é possível entrar: vôlei fechado (menos de 1h para o jogo)" };

  const participantCount = game.game_participants.length;

  if (participantCount >= game.max_players) {
    const { error } = await supabase.from("waiting_list").insert({
      game_id: gameId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === "23505") return { error: "Você já está na lista de espera" };
      return { error: error.message };
    }
    revalidatePath(`/games/${gameId}`);
    return { success: "Você entrou na lista de espera!" };
  }

  const { error } = await supabase.from("game_participants").insert({
    game_id: gameId,
    user_id: user.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "Você já está na lista" };
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  return { success: "Você foi adicionado à lista!" };
}

export async function leaveGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("date, time, status")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Jogo não encontrado" };
  if (game.status !== "active") return { error: "Este jogo não está ativo" };
  if (!canLeave(game.date, game.time))
    return { error: "Não é possível sair: faltam menos de 2h para o jogo" };

  const { error } = await supabase
    .from("game_participants")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Promove primeiro da lista de espera, se houver
  const { data: firstWaiting } = await supabase
    .from("waiting_list")
    .select("*")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (firstWaiting) {
    await supabase.from("game_participants").insert({
      game_id: gameId,
      user_id: firstWaiting.user_id,
    });
    await supabase
      .from("waiting_list")
      .delete()
      .eq("id", firstWaiting.id);
  }

  revalidatePath(`/games/${gameId}`);
  return { success: "Você saiu da lista" };
}

export async function leaveWaitingList(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("waiting_list")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  return { success: "Você saiu da lista de espera" };
}

export async function confirmPayment(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("game_participants")
    .update({ payment_status: "confirmed" })
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  return { success: "Pagamento confirmado!" };
}

export async function confirmParticipantPayment(
  gameId: string,
  participantId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("organizer_id")
    .eq("id", gameId)
    .single();

  if (!game || game.organizer_id !== user.id)
    return { error: "Apenas o organizador pode confirmar pagamentos" };

  const { error } = await supabase
    .from("game_participants")
    .update({ payment_status: "confirmed" })
    .eq("id", participantId)
    .eq("game_id", gameId);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  return { success: "Pagamento confirmado!" };
}

export async function closeGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("organizer_id")
    .eq("id", gameId)
    .single();

  if (!game || game.organizer_id !== user.id)
    return { error: "Apenas o organizador pode encerrar o jogo" };

  const { error } = await supabase
    .from("games")
    .update({ status: "closed" })
    .eq("id", gameId);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/");
  return { success: "Jogo encerrado!" };
}

export async function cancelGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("organizer_id")
    .eq("id", gameId)
    .single();

  if (!game || game.organizer_id !== user.id)
    return { error: "Apenas o organizador pode cancelar o jogo" };

  const { error } = await supabase
    .from("games")
    .update({ status: "cancelled" })
    .eq("id", gameId);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/");
  return { success: "Jogo cancelado" };
}
