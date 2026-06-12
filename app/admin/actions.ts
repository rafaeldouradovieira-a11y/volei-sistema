"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const admin = createAdminClient();
  const { data: ap } = await admin
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!ap?.is_admin) throw new Error("Acesso negado");
  return { supabase, admin };
}

export type AddPhoneInput = {
  phone: string;
  display_name?: string;
  is_admin?: boolean;
  invited_by_id?: string | null;
};

export type AddPhoneResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPhone(input: AddPhoneInput): Promise<AddPhoneResult> {
  try {
    const { admin } = await requireAdmin();

    const phone = normalizePhone(input.phone);
    if (!phone || phone.length < 10) {
      return { ok: false, error: "Telefone inválido." };
    }

    const { error } = await admin.from("authorized_phones").insert({
      phone,
      display_name: input.display_name?.trim() || null,
      is_admin: input.is_admin ?? false,
      invited_by_id: input.invited_by_id ?? null,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Este número já está cadastrado." };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

export async function removePhone(id: string): Promise<AddPhoneResult> {
  try {
    const { admin } = await requireAdmin();

    const { error } = await admin
      .from("authorized_phones")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

export async function authorizeFromAttempt(phone: string): Promise<AddPhoneResult> {
  try {
    const { admin } = await requireAdmin();

    const { error } = await admin.from("authorized_phones").insert({ phone });

    if (error) {
      if (error.code === "23505") return { ok: false, error: "Número já autorizado." };
      return { ok: false, error: error.message };
    }

    await admin.from("unauthorized_attempts").delete().eq("phone", phone);

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

export async function toggleAdmin(id: string, is_admin: boolean): Promise<AddPhoneResult> {
  try {
    const { admin } = await requireAdmin();

    const { error } = await admin
      .from("authorized_phones")
      .update({ is_admin })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}
