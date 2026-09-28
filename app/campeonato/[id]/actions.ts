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

export async function checkinChampionship(championshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado" };

  const { data: championship } = await supabase
    .from("championships")
    .select("status")
    .eq("id", championshipId)
    .single();

  if (!championship) return { error: "Campeonato não encontrado" };
  if (championship.status !== "active")
    return { error: "As inscrições deste campeonato estão encerradas" };

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
