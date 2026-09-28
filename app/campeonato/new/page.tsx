import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewChampionshipForm } from "@/components/campeonato/new-championship-form";

export const dynamic = "force-dynamic";

export default async function NewChampionshipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/campeonato/new");

  const admin = createAdminClient();
  const { data: myPhone } = await admin
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!myPhone?.is_admin) redirect("/campeonato");

  return <NewChampionshipForm />;
}
