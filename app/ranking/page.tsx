import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

type RankEntry = { id: string; name: string | null; wins: number };

async function getRanking(supabase: Awaited<ReturnType<typeof createClient>>, since: Date) {
  const { data: wins } = await supabase
    .from("match_wins")
    .select("player_id")
    .gte("played_at", since.toISOString());

  if (!wins || wins.length === 0) return [];

  const countMap = new Map<string, number>();
  for (const { player_id } of wins) {
    countMap.set(player_id, (countMap.get(player_id) ?? 0) + 1);
  }

  const playerIds = [...countMap.keys()];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", playerIds);

  if (!profiles) return [];

  return profiles
    .map((p) => ({ id: p.id, name: p.name, wins: countMap.get(p.id) ?? 0 }))
    .sort((a, b) => b.wins - a.wins);
}

const MEDAL = ["🥇", "🥈", "🥉"];

function RankList({ entries }: { entries: RankEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma vitória registrada ainda</p>;
  }
  return (
    <div className="space-y-1">
      {entries.map((e, i) => (
        <div
          key={e.id}
          className="flex items-center gap-3 py-3 px-3 rounded-xl"
          style={{ background: i === 0 ? "oklch(0.97 0.03 85)" : "transparent" }}
        >
          <span className="text-xl w-7 text-center">{MEDAL[i] ?? `${i + 1}.`}</span>
          <span className="flex-1 font-medium text-sm" style={{ color: "var(--color-brand)" }}>
            {e.name ?? "—"}
          </span>
          <span
            className="font-extrabold text-sm px-2 py-0.5 rounded-full"
            style={{
              fontFamily: "var(--font-syne)",
              background: "var(--color-brand)",
              color: "var(--color-lime)",
            }}
          >
            {e.wins}v
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "weekly" } = await searchParams;
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const epoch = new Date(0);

  const since =
    tab === "monthly" ? monthStart :
    tab === "all"     ? epoch      :
                        weekAgo;

  const entries = await getRanking(supabase, since);

  const tabs = [
    { key: "weekly",  label: "Semana" },
    { key: "monthly", label: "Mês" },
    { key: "all",     label: "Geral" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <div style={{ background: "var(--color-brand)" }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center gap-3">
          <Link href="/">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
            >
              <ArrowLeft size={16} />
            </button>
          </Link>
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-syne)" }}
          >
            Ranking
          </span>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy size={28} color="var(--color-lime)" />
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "white" }}
            >
              RANKING
            </h1>
          </div>

          <div className="flex gap-2">
            {tabs.map((t) => (
              <Link key={t.key} href={`/ranking?tab=${t.key}`}>
                <button
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  style={{
                    fontFamily: "var(--font-syne)",
                    background: tab === t.key ? "var(--color-lime)" : "rgba(255,255,255,0.1)",
                    color: tab === t.key ? "var(--color-brand)" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {t.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <RankList entries={entries} />
        </div>
      </main>
    </div>
  );
}
