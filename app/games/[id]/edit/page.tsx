import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import EditGameForm from "./form";
import type { Game } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGamePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?redirect=/games/${id}/edit`);

  const { data } = await supabase.from("games").select("*").eq("id", id).single();
  if (!data) notFound();

  const game = data as Game;
  if (game.organizer_id !== user.id) {
    // Admins podem editar jogos de outros organizadores
    const { data: adminCheck } = await createAdminClient()
      .from("authorized_phones")
      .select("is_admin")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!adminCheck?.is_admin) redirect(`/games/${id}`);
  }

  return <EditGameForm game={game} />;
}
