import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/game/header";
import { ChampionshipCard } from "@/components/campeonato/championship-card";
import type { ChampionshipWithDetails } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CampeonatoPage() {
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

  const { data: championships } = await supabase
    .from("championships")
    .select(`*, profiles(*), championship_participants(*, profiles(*))`)
    .order("created_at", { ascending: false });

  const list = (championships as ChampionshipWithDetails[] | null) ?? [];
  const activeChampionships = list.filter((c) => c.status === "active");
  const closedChampionships = list.filter((c) => c.status === "closed");

  return (
    <div className="min-h-screen flex flex-col">
      <Header profile={profile} isAdmin={isAdmin} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-10">
        <div className="py-7 flex items-end justify-between">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--color-lime)", fontFamily: "var(--font-syne)", filter: "brightness(0.6)" }}
            >
              Competições
            </p>
            <h1
              className="text-4xl font-extrabold leading-none tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              CAMPEONATO
            </h1>
          </div>

          {isAdmin && (
            <Link href="/campeonato/new">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "var(--color-brand)",
                  color: "var(--color-lime)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                <span className="text-lg leading-none">+</span>
                Criar campeonato
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
              Abertos{" "}
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--color-lime)", color: "var(--color-brand)" }}
              >
                {activeChampionships.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="closed"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Encerrados{" "}
              <span className="ml-1.5 text-xs opacity-50">
                {closedChampionships.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeChampionships.length === 0 ? (
              <EmptyState
                icon="🏆"
                title="Nenhum campeonato aberto"
                subtitle="Quando um admin criar um campeonato, ele aparece aqui"
              />
            ) : (
              <div className="space-y-3">
                {activeChampionships.map((championship, i) => (
                  <div key={championship.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <ChampionshipCard championship={championship} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {closedChampionships.length === 0 ? (
              <EmptyState
                icon="📋"
                title="Nenhum campeonato encerrado"
                subtitle="Os campeonatos encerrados aparecerão aqui"
              />
            ) : (
              <div className="space-y-3">
                {closedChampionships.map((championship, i) => (
                  <div key={championship.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <ChampionshipCard championship={championship} />
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
  subtitle: string;
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
