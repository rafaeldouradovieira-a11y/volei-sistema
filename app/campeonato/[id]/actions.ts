"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isStage } from "@/lib/championship-stage";
import { isProfileComplete } from "@/lib/championship-profile";
import { buildPots, checkDraw, type PotCandidate } from "@/lib/championship-pots";
import { randomInt } from "node:crypto";

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

export async function checkinChampionship(championshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: championship } = await supabase
    .from("championships")
    .select("status, stage")
    .eq("id", championshipId)
    .single();

  if (!championship) return { error: "Campeonato não encontrado" };
  if (championship.status !== "active" || championship.stage !== "registration")
    return { error: "As inscrições deste campeonato estão encerradas" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!isProfileComplete(profile))
    return { error: "Complete seu perfil (idade, altura, peso, gênero e foto) para se inscrever" };

  const { error } = await supabase.from("championship_participants").insert({
    championship_id: championshipId,
    user_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  return { success: "Check-in feito!" };
}

export async function leaveChampionship(championshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("championship_participants")
    .delete()
    .eq("championship_id", championshipId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  return { success: "Você saiu da lista" };
}

export async function closeChampionship(championshipId: string) {
  if (!(await isCurrentUserAdmin()))
    return { error: "Apenas admins podem encerrar o campeonato" };

  const { error } = await createAdminClient()
    .from("championships")
    .update({ status: "closed" })
    .eq("id", championshipId);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  revalidatePath("/campeonato");
  return { success: "Campeonato encerrado!" };
}

export async function reopenChampionship(championshipId: string) {
  if (!(await isCurrentUserAdmin()))
    return { error: "Apenas admins podem reabrir o campeonato" };

  const { error } = await createAdminClient()
    .from("championships")
    .update({ status: "active" })
    .eq("id", championshipId);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  revalidatePath("/campeonato");
  return { success: "Campeonato reaberto!" };
}

export async function saveChampionshipProof(championshipId: string, proofUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("championship_participants")
    .update({ proof_url: proofUrl })
    .eq("championship_id", championshipId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  return { success: "Comprovante enviado!" };
}

export async function confirmMyChampionshipPayment(championshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { error } = await supabase
    .from("championship_participants")
    .update({ payment_status: "confirmed" })
    .eq("championship_id", championshipId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  return { success: "Inscrição confirmada!" };
}

export async function confirmChampionshipParticipantPayment(
  championshipId: string,
  participantId: string
) {
  if (!(await isCurrentUserAdmin()))
    return { error: "Apenas admins podem confirmar inscrições" };

  const { error } = await createAdminClient()
    .from("championship_participants")
    .update({ payment_status: "confirmed" })
    .eq("id", participantId)
    .eq("championship_id", championshipId);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  return { success: "Inscrição confirmada!" };
}

export async function updateChampionship(
  championshipId: string,
  formData: {
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    court: string | null;
    price_per_person: number | null;
    pix_key: string | null;
    registration_start: string | null;
    registration_end: string | null;
    voting_end: string | null;
    draw_at: string | null;
  }
) {
  if (!(await isCurrentUserAdmin()))
    return { error: "Apenas admins podem editar o campeonato" };

  const { error } = await createAdminClient()
    .from("championships")
    .update({
      title: formData.title,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      court: formData.court,
      price_per_person: formData.price_per_person,
      pix_key: formData.pix_key,
      registration_start: formData.registration_start,
      registration_end: formData.registration_end,
      voting_end: formData.voting_end,
      draw_at: formData.draw_at,
    })
    .eq("id", championshipId);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  revalidatePath("/campeonato");
  return { success: "Campeonato atualizado!" };
}

export async function setChampionshipStage(championshipId: string, stage: string) {
  if (!(await isCurrentUserAdmin()))
    return { error: "Apenas admins podem mudar a etapa" };
  if (!isStage(stage)) return { error: "Etapa inválida" };

  const { error } = await createAdminClient()
    .from("championships")
    .update({ stage })
    .eq("id", championshipId);

  if (error) return { error: error.message };
  revalidatePath(`/campeonato/${championshipId}`);
  revalidatePath("/campeonato");
  return { success: "Etapa atualizada!" };
}

export async function saveMyChampionshipProfile(data: {
  age: number;
  height_cm: number;
  weight_kg: number;
  gender: "F" | "M";
  avatar_url?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  if (!Number.isInteger(data.age) || data.age < 5 || data.age > 100)
    return { error: "Idade inválida" };
  if (!Number.isInteger(data.height_cm) || data.height_cm < 100 || data.height_cm > 250)
    return { error: "Altura inválida (em cm)" };
  if (!(data.weight_kg >= 20 && data.weight_kg <= 300)) return { error: "Peso inválido (em kg)" };
  if (data.gender !== "F" && data.gender !== "M") return { error: "Gênero inválido" };

  const update: {
    age: number;
    height_cm: number;
    weight_kg: number;
    gender: "F" | "M";
    avatar_url?: string;
  } = {
    age: data.age,
    height_cm: data.height_cm,
    weight_kg: data.weight_kg,
    gender: data.gender,
  };
  if (data.avatar_url) update.avatar_url = data.avatar_url;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: error.message };
  return { success: "Perfil salvo!" };
}

export async function saveChampionshipVote(
  championshipId: string,
  candidateId: string,
  score: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };
  if (candidateId === user.id) return { error: "Você não pode votar em si mesmo" };
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5))
    return { error: "Nota inválida" };

  const { data: championship } = await supabase
    .from("championships")
    .select("status, stage, voting_end")
    .eq("id", championshipId)
    .single();
  if (!championship) return { error: "Campeonato não encontrado" };
  if (championship.status !== "active" || championship.stage !== "voting")
    return { error: "A votação não está aberta" };
  if (championship.voting_end && new Date(championship.voting_end) < new Date())
    return { error: "O prazo da votação acabou" };

  // Qualquer inscrito vota; só quem não é mulher pode ser votado
  const { data: participants } = await supabase
    .from("championship_participants")
    .select("user_id, profiles(gender)")
    .eq("championship_id", championshipId)
    .in("user_id", [user.id, candidateId]);

  const rows = (participants ?? []) as unknown as {
    user_id: string;
    profiles: { gender: "F" | "M" | null } | null;
  }[];
  if (!rows.some((r) => r.user_id === user.id))
    return { error: "Só quem está inscrito pode votar" };
  const candidate = rows.find((r) => r.user_id === candidateId);
  if (!candidate) return { error: "Esse jogador não está inscrito" };
  if (candidate.profiles?.gender !== "M")
    return { error: "Só os homens entram na votação" };

  if (score === null) {
    const { error } = await supabase
      .from("championship_votes")
      .delete()
      .eq("championship_id", championshipId)
      .eq("voter_id", user.id)
      .eq("candidate_id", candidateId);
    if (error) return { error: error.message };
    return { success: "Nota removida" };
  }

  const { error } = await supabase.from("championship_votes").upsert(
    { championship_id: championshipId, voter_id: user.id, candidate_id: candidateId, score },
    { onConflict: "championship_id,voter_id,candidate_id" }
  );
  if (error) return { error: error.message };
  return { success: "Nota salva" };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sorteia os times: cada time leva 1 menina + 1 de cada pote de homens (A, B, C).
// Refazer apaga o sorteio anterior.
export async function drawChampionshipTeams(championshipId: string) {
  if (!(await isCurrentUserAdmin()))
    return { error: "Apenas admins podem sortear os times" };

  const admin = createAdminClient();
  const { data: championship } = await admin
    .from("championships")
    .select("status, stage")
    .eq("id", championshipId)
    .single();
  if (!championship) return { error: "Campeonato não encontrado" };
  if (championship.status !== "active" || championship.stage !== "draw")
    return { error: "O sorteio só pode ser feito na etapa Sorteio" };

  const { data: participants } = await admin
    .from("championship_participants")
    .select("user_id, joined_at, profiles(name, avatar_url, gender)")
    .eq("championship_id", championshipId);
  const { data: votes } = await admin
    .from("championship_votes")
    .select("candidate_id, score")
    .eq("championship_id", championshipId);

  const rows = (participants ?? []) as unknown as {
    user_id: string;
    joined_at: string;
    profiles: { name: string | null; avatar_url: string | null; gender: "F" | "M" | null } | null;
  }[];
  const candidates: PotCandidate[] = rows.map((r) => ({
    id: r.user_id,
    name: r.profiles?.name ?? null,
    avatar_url: r.profiles?.avatar_url ?? null,
    gender: r.profiles?.gender ?? null,
    joined_at: r.joined_at,
  }));

  const pots = buildPots(candidates, votes ?? []);
  const check = checkDraw(pots);
  if (!check.ok) return { error: check.message ?? "Não foi possível sortear" };

  await admin.from("championship_teams").delete().eq("championship_id", championshipId);

  const { data: teams, error: teamsError } = await admin
    .from("championship_teams")
    .insert(
      Array.from({ length: check.teamCount }, (_, i) => ({
        championship_id: championshipId,
        name: `Time ${i + 1}`,
      }))
    )
    .select("id, name");
  if (teamsError || !teams) return { error: teamsError?.message ?? "Erro ao criar os times" };

  const ordered = [...teams].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
  const potsByName = {
    girls: shuffle(pots.girls),
    A: shuffle(pots.A),
    B: shuffle(pots.B),
    C: shuffle(pots.C),
  };
  const members = ordered.flatMap((team, i) =>
    (["girls", "A", "B", "C"] as const).map((pot) => ({
      team_id: team.id,
      championship_id: championshipId,
      user_id: potsByName[pot][i].id,
      pot,
    }))
  );

  const { error: membersError } = await admin.from("championship_team_members").insert(members);
  if (membersError) {
    await admin.from("championship_teams").delete().eq("championship_id", championshipId);
    return { error: membersError.message };
  }

  revalidatePath(`/campeonato/${championshipId}`);
  return { success: `${check.teamCount} times sorteados!` };
}
