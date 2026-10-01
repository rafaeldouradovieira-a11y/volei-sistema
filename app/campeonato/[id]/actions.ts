"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isStage } from "@/lib/championship-stage";
import { isProfileComplete } from "@/lib/championship-profile";

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
