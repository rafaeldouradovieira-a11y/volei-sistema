import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  let isAdmin = false;
  if (user) {
    const admin = createAdminClient();
    const { data: ap } = await admin
      .from("authorized_phones")
      .select("is_admin")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    isAdmin = ap?.is_admin ?? false;
  }

  const { data: games } = await supabase
    .from("games")
    .select(
      `*,
      profiles(*),
      game_participants(*, profiles(*)),
      waiting_list(*, profiles(*)),
      game_guests(id)`
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
      <Header profile={profile} isAdmin={isAdmin} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-10">
        {/* Page hero */}
        <div className="py-7 flex items-end justify-between">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--color-lime)", fontFamily: "var(--font-syne)", filter: "brightness(0.6)" }}
            >
              Seus jogos
            </p>
            <h1
              className="text-4xl font-extrabold leading-none tracking-tight"
              style={{
                fontFamily: "var(--font-syne)",
                color: "var(--color-brand)",
              }}
            >
              JOGOS
            </h1>
          </div>

          {user && (
            <Link href="/games/new">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "var(--color-brand)",
                  color: "var(--color-lime)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                <span className="text-lg leading-none">+</span>
                Criar vôlei
              </button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="active">
          <TabsList
            className="w-full mb-5 p-1 rounded-xl h-auto gap-1"
            style={{ background: "#1a1a1a" }}
          >
            <TabsTrigger
              value="active"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all data-[state=active]:shadow-sm"
              style={
                {
                  fontFamily: "var(--font-syne)",
                  "--tw-data-active-bg": "var(--color-brand)",
                } as React.CSSProperties
              }
            >
              Ativos{" "}
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--color-lime)", color: "var(--color-brand)" }}
              >
                {activeGames.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="closed"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Encerrados{" "}
              <span className="ml-1.5 text-xs opacity-50">
                {closedGames.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeGames.length === 0 ? (
              <EmptyState
                icon="🏐"
                title="Nenhum jogo ativo"
                subtitle={
                  user ? (
                    <>
                      Que tal{" "}
                      <Link
                        href="/games/new"
                        className="underline underline-offset-2"
                        style={{ color: "var(--color-brand)" }}
                      >
                        criar o primeiro?
                      </Link>
                    </>
                  ) : (
                    "Entre para criar ou participar de jogos"
                  )
                }
              />
            ) : (
              <div className="space-y-3">
                {activeGames.map((game, i) => (
                  <div
                    key={game.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <GameCard game={game} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {closedGames.length === 0 ? (
              <EmptyState
                icon="📋"
                title="Nenhum jogo encerrado"
                subtitle="Os jogos encerrados aparecerão aqui"
              />
            ) : (
              <div className="space-y-3">
                {closedGames.map((game, i) => (
                  <div
                    key={game.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <GameCard game={game} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 space-y-2">
      <div className="text-5xl mb-4">{icon}</div>
      <p
        className="font-semibold text-base"
        style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
      >
        {title}
      </p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
