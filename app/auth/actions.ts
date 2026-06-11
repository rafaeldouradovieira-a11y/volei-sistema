"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

export type PhoneLoginResult =
  | { ok: true; tokenHash: string }
  | { ok: false; error: "unauthorized" | "invalid_phone" | string };

export async function phoneLogin(rawPhone: string): Promise<PhoneLoginResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 10) {
    return { ok: false, error: "invalid_phone" };
  }

  const admin = createAdminClient();

  // Also try alternate form: add/remove the 9th digit on local number
  // e.g. stored "6992178522" (10 digits) also matches input "69992178522" (11 digits)
  const altPhone =
    phone.length === 11
      ? phone.slice(0, 2) + phone.slice(3) // 11→10: remove 9 after DDD
      : phone.length === 10
      ? phone.slice(0, 2) + "9" + phone.slice(2) // 10→11: add 9 after DDD
      : null;

  const candidates = altPhone ? [phone, altPhone] : [phone];

  const { data: authPhone } = await admin
    .from("authorized_phones")
    .select("id, auth_user_id")
    .in("phone", candidates)
    .limit(1)
    .maybeSingle();

  if (!authPhone) {
    // Log the attempt for admin notification
    await admin.from("unauthorized_attempts").insert({ phone });
    return { ok: false, error: "unauthorized" };
  }

  const email = `p${phone}@volei.internal`;

  // Create Supabase auth user on first login
  if (!authPhone.auth_user_id) {
    const { data: userData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createError || !userData.user) {
      return { ok: false, error: "Erro ao criar usuário. Tente novamente." };
    }

    await admin
      .from("authorized_phones")
      .update({ auth_user_id: userData.user.id })
      .eq("id", authPhone.id);
  }

  // Generate a magic link token (server-side only, no email sent)
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    return { ok: false, error: "Erro ao autenticar. Tente novamente." };
  }

  return { ok: true, tokenHash: linkData.properties.hashed_token };
}
