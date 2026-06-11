import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: starterProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", match.started_by)
    .maybeSingle();

  return (
    <Scoreboard
      initialMatch={match}
      currentUserId={user.id}
      starterName={starterProfile?.name ?? null}
    />
  );
}
