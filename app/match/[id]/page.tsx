import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Scoreboard from "./scoreboard";
import type { Match } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const match = data as Match;

  const adminClient = createAdminClient();
  const [{ data: starterProfile }, { data: adminCheck }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", match.started_by).maybeSingle(),
    adminClient.from("authorized_phones").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
  ]);

  return (
    <Scoreboard
      initialMatch={match}
      currentUserId={user.id}
      starterName={starterProfile?.name ?? null}
      isAdmin={adminCheck?.is_admin ?? false}
    />
  );
}
