import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Trophy, CalendarCheck, Swords, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { EditProfileButton } from "@/components/perfil/edit-profile-button";
import type { Match, Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const SYNE = { fontFamily: "var(--font-syne)" } as const;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PerfilPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?redirect=/perfil/${id}`);

  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const profile = data as Profile;
  const isMe = user.id === profile.id;

  const [{ count: checkins }, { count: championships }, { data: matchRows }] = await Promise.all([
    supabase
      .from("game_participants")
      .select("id, games!inner(status)", { count: "exact", head: true })
      .eq("user_id", id)
      .neq("games.status", "cancelled"),
    supabase
      .from("championship_participants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id),
    supabase
      .from("matches")
      .select("*, games(title, location, date)")
      .eq("status", "finished")
      .order("started_at", { ascending: false })
      .limit(300),
  ]);

  type MatchRow = Match & { games: { title: string | null; location: string; date: string } | null };
  const played = ((matchRows ?? []) as unknown as MatchRow[])
    .map((m) => {
      const inT1 = m.team1.some((p) => p.profile_id === id);
      const inT2 = m.team2.some((p) => p.profile_id === id);
      if (!inT1 && !inT2) return null;
      const team = inT1 ? 1 : 2;
      return { match: m, team, won: m.winner === team };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const wins = played.filter((p) => p.won).length;
  const winRate = played.length ? Math.round((wins / played.length) * 100) : null;

  const stats = [
    { icon: CalendarCheck, label: "Check-ins", value: checkins ?? 0 },
    { icon: Swords, label: "Partidas", value: played.length },
    { icon: Trophy, label: "Vitórias", value: wins, sub: winRate != null ? `${winRate}%` : undefined },
    { icon: Award, label: "Campeonatos", value: championships ?? 0 },
  ];

  const bio = [
    profile.age != null ? `${profile.age} anos` : null,
    profile.height_cm != null ? `${profile.height_cm} cm` : null,
    profile.weight_kg != null ? `${profile.weight_kg} kg` : null,
  ].filter(Boolean);

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
            style={{ color: "rgba(255,255,255,0.5)", ...SYNE }}
          >
            Perfil
          </span>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 flex flex-col items-center text-center">
          <Avatar name={profile.name} url={profile.avatar_url} size={112} ring />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white" style={SYNE}>
            {profile.name ?? "Jogador"}
          </h1>
          {bio.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {bio.join(" · ")}
            </p>
          )}
          {isMe && (
            <div className="mt-4">
              <EditProfileButton profile={profile} />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-6 pb-10 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card rounded-2xl py-3 px-1 text-center shadow-sm">
                <Icon size={14} className="mx-auto mb-1" style={{ color: "var(--color-brand)" }} />
                <div className="score-number text-2xl leading-none">{s.value}</div>
                {s.sub && (
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#34d399" }}>
                    {s.sub}
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <section className="bg-card rounded-2xl p-5 shadow-sm">
          <h3
            className="text-sm font-bold tracking-wide uppercase mb-3"
            style={{ ...SYNE, color: "var(--color-brand)" }}
          >
            Últimas partidas
          </h3>
          {played.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma partida registrada ainda
            </p>
          ) : (
            <div className="space-y-2">
              {played.slice(0, 8).map(({ match: m, team, won }) => {
                const mine = team === 1 ? m.score1 : m.score2;
                const theirs = team === 1 ? m.score2 : m.score1;
                return (
                  <Link
                    key={m.id}
                    href={`/games/${m.game_id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                      style={{
                        ...SYNE,
                        background: won ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                        color: won ? "#34d399" : "#f87171",
                      }}
                    >
                      {won ? "V" : "D"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {m.games?.title || m.games?.location || "Vôlei"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.games?.date
                          ? format(parseISO(m.games.date), "dd 'de' MMM", { locale: ptBR })
                          : ""}
                      </p>
                    </div>
                    <span className="score-number text-lg">
                      {mine}
                      <span className="text-muted-foreground mx-1">×</span>
                      {theirs}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
