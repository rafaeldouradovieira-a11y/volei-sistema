"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { canJoin, canLeave, isWithin48Hours } from "@/lib/game-time";
import { normalizePhone } from "@/lib/phone";
import type { MatchPlayer } from "@/lib/supabase/types";

// Promotes oldest waiting guests to active when within 48h and spots are available
async function promoteWaitingGuests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameId: string,
  gameDate: string,
  gameTime: string,
  maxPlayers: number
) {
  if (!isWithin48Hours(gameDate, gameTime)) return;

  const [{ count: pCount }, { count: gCount }] = await Promise.all([
    supabase.from("game_participants").select("id", { count: "exact", head: true }).eq("game_id", gameId),
    supabase.from("game_guests").select("id", { count: "exact", head: true }).eq("game_id", gameId).eq("status", "active"),
  ]);

  const available = maxPlayers - ((pCount ?? 0) + (gCount ?? 0));
  if (available <= 0) return;

  const { data: toPromote } = await supabase
    .from("game_guests")
    .select("id")
    .eq("game_id", gameId)
    .eq("status", "waiting")
    .order("joined_at", { ascending: true })
    .limit(available);

  if (!toPromote?.length) return;
  await supabase.from("game_guests").update({ status: "active" }).in("id", toPromote.map((g) => g.id));
}

export async function joinGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("*, game_participants(id), game_guests(id, status)")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Jogo não encontrado" };
  if (game.status !== "active") return { error: "Este jogo não está ativo" };
  if (!canJoin(game.date, game.time, game.allow_late_checkin))
    return { error: "Não é possível entrar: vôlei fechado (menos de 1h para o jogo)" };

  const participantCount =
    game.game_participants.length +
    game.game_guests.filter((g: { status: string }) => g.status === "active").length;

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
    .select("date, time, status, max_players, allow_early_leave")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Jogo não encontrado" };
  if (game.status !== "active") return { error: "Este jogo não está ativo" };
  if (!canLeave(game.date, game.time, game.allow_early_leave))
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
  } else {
    // No regular waiting participant — try to promote a waiting guest
    await promoteWaitingGuests(supabase, gameId, game.date, game.time, game.max_players);
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

export async function addGuest(gameId: string, guestName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const name = guestName.trim();
  if (!name) return { error: "Nome do convidado é obrigatório" };

  const { data: game } = await supabase
    .from("games")
    .select("*, game_participants(id, user_id), game_guests(id, status)")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Jogo não encontrado" };
  if (game.status !== "active") return { error: "Este jogo não está ativo" };
  if (!canJoin(game.date, game.time, game.allow_late_checkin))
    return { error: "Inscrições encerradas (menos de 1h para o jogo)" };

  const isParticipant = game.game_participants.some((p: { user_id: string }) => p.user_id === user.id);
  if (!isParticipant) return { error: "Apenas participantes podem adicionar convidados" };

  // Promote any 48h-eligible waiting guests before counting active spots
  await promoteWaitingGuests(supabase, gameId, game.date, game.time, game.max_players);

  const activeGuestCount = game.game_guests.filter((g: { status: string }) => g.status === "active").length;
  const totalActive = game.game_participants.length + activeGuestCount;

  const within48h = isWithin48Hours(game.date, game.time);
  const isFull = totalActive >= game.max_players;
  const guestStatus = !within48h || isFull ? "waiting" : "active";

  const { error } = await supabase.from("game_guests").insert({
    game_id: gameId,
    invited_by: user.id,
    name,
    status: guestStatus,
  });

  if (error) return { error: error.message };

  revalidatePath(`/games/${gameId}`);

  if (!within48h) {
    return { success: `${name} entrou na lista de espera — convidados só são confirmados a partir de 48h antes do evento` };
  }
  if (isFull) {
    return { success: `${name} entrou na lista de espera — jogo lotado` };
  }
  return { success: `${name} adicionado(a) à lista!` };
}

export async function removeGuest(guestId: string, gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("game_guests")
    .delete()
    .eq("id", guestId)
    .eq("game_id", gameId);

  if (error) return { error: error.message };

  revalidatePath(`/games/${gameId}`);
  return { success: "Convidado removido" };
}

export async function confirmGuestPayment(guestId: string, gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("game_guests")
    .update({ payment_status: "confirmed" })
    .eq("id", guestId)
    .eq("game_id", gameId);

  if (error) return { error: error.message };

  revalidatePath(`/games/${gameId}`);
  return { success: "Pagamento confirmado!" };
}

export async function saveProof(gameId: string, proofUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("game_participants")
    .update({ proof_url: proofUrl })
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  return { success: "Comprovante enviado!" };
}

export async function startMatch(
  gameId: string,
  team1: MatchPlayer[],
  team2: MatchPlayer[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("game_id", gameId)
    .eq("status", "live")
    .maybeSingle();

  if (existing) return { error: "Já há uma partida ao vivo para este jogo" };

  const { data: match, error } = await supabase
    .from("matches")
    .insert({ game_id: gameId, started_by: user.id, team1, team2 })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/games/${gameId}`);
  return { success: "Partida iniciada!", matchId: match.id };
}

export async function updateGame(
  gameId: string,
  formData: {
    title: string;
    date: string;
    time: string;
    location: string;
    court: string;
    duration_hours: number;
    max_players: number;
    price_total: number | null;
    pix_key: string | null;
    allow_late_checkin: boolean;
    allow_early_leave: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: game } = await supabase
    .from("games")
    .select("organizer_id")
    .eq("id", gameId)
    .single();

  if (!game || game.organizer_id !== user.id)
    return { error: "Apenas o organizador pode editar o jogo" };

  const { error } = await supabase
    .from("games")
    .update({
      title: formData.title || null,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      court: formData.court || null,
      duration_hours: formData.duration_hours,
      max_players: formData.max_players,
      price_total: formData.price_total,
      pix_key: formData.pix_key,
      allow_late_checkin: formData.allow_late_checkin,
      allow_early_leave: formData.allow_early_leave,
    })
    .eq("id", gameId);

  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/");
  return { success: "Jogo atualizado!" };
}

export async function promoteToPlayer(gameId: string, id: string, kind: "participant" | "guest") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const admin = createAdminClient();
  const { data: caller } = await admin
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!caller?.is_admin) return { error: "Acesso negado" };

  if (kind === "guest") {
    const { error } = await admin
      .from("game_guests")
      .update({ status: "active" })
      .eq("id", id)
      .eq("game_id", gameId);
    if (error) return { error: error.message };
  } else {
    const { data: entry } = await admin
      .from("waiting_list")
      .select("user_id")
      .eq("id", id)
      .eq("game_id", gameId)
      .single();
    if (!entry) return { error: "Entrada não encontrada" };

    const { error: insertError } = await admin
      .from("game_participants")
      .insert({ game_id: gameId, user_id: entry.user_id });
    if (insertError) {
      if (insertError.code === "23505") return { error: "Pessoa já está na lista" };
      return { error: insertError.message };
    }
    await admin.from("waiting_list").delete().eq("id", id);
  }

  revalidatePath(`/games/${gameId}`);
  return { success: "Movido para a lista!" };
}

export async function addParticipantByPhone(gameId: string, phone: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const admin = createAdminClient();

  const { data: caller } = await admin
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!caller?.is_admin) return { error: "Acesso negado" };

  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 10) return { error: "Telefone inválido" };

  const { data: target } = await admin
    .from("authorized_phones")
    .select("auth_user_id, display_name")
    .eq("phone", normalized)
    .maybeSingle();

  if (!target) return { error: "Telefone não encontrado na lista de autorizados" };
  if (!target.auth_user_id) return { error: "Esta pessoa ainda não acessou o sistema" };

  const { data: game } = await admin
    .from("games")
    .select("status, game_participants(user_id)")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Jogo não encontrado" };
  if (game.status !== "active") return { error: "Este jogo não está ativo" };

  const alreadyIn = (game.game_participants as { user_id: string }[]).some(
    (p) => p.user_id === target.auth_user_id
  );
  if (alreadyIn) return { error: "Esta pessoa já está na lista" };

  const { error } = await admin.from("game_participants").insert({
    game_id: gameId,
    user_id: target.auth_user_id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Esta pessoa já está na lista" };
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  const name = target.display_name ?? normalized;
  return { success: `${name} adicionado(a) à lista!` };
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
