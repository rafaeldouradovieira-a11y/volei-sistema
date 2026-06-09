import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Header } from "@/components/game/header";
import { GameCard } from "@/components/game/game-card";
import type { GameWithDetails } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const { data: games } = await supabase
    .from("games")
    .select(
      `
      *,
      profiles(*),
      game_participants(*, profiles(*)),
      waiting_list(*, profiles(*))
    `
    )
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  const activeGames =
    (games as GameWithDetails[] | null)?.filter(
      (g) => g.status === "active"
    ) ?? [];
  const closedGames =
    (games as GameWithDetails[] | null)?.filter(
      (g) => g.status !== "active"
    ) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header profile={profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Jogos</h1>
          {user && (
            <Link href="/games/new">
              <Button size="sm" className="gap-1.5">
                <Plus size={16} />
                Criar vôlei
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="active">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="active" className="flex-1">
              Ativos ({activeGames.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              Encerrados ({closedGames.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeGames.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🏐</div>
                <p className="font-medium">Nenhum jogo ativo</p>
                {user && (
                  <p className="text-sm mt-1">
                    Que tal{" "}
                    <Link href="/games/new" className="text-blue-500 underline">
                      criar o primeiro?
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activeGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {closedGames.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>Nenhum jogo encerrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {closedGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
