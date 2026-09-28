import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import EditChampionshipForm from "./form";
import type { Championship } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditChampionshipPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?redirect=/campeonato/${id}/edit`);

  const { data } = await supabase.from("championships").select("*").eq("id", id).single();
  if (!data) notFound();

  const { data: adminCheck } = await createAdminClient()
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!adminCheck?.is_admin) redirect(`/campeonato/${id}`);

  return <EditChampionshipForm championship={data as Championship} />;
}
