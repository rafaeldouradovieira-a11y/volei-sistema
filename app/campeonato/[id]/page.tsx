import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Users, Clock, MapPin, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckinButton } from "@/components/campeonato/checkin-button";
import { StatusButton } from "@/components/campeonato/status-button";
import { CheckinPaymentButton } from "@/components/campeonato/checkin-payment-button";
import { ConfirmCheckinButton } from "@/components/campeonato/confirm-checkin-button";
import { CopyCheckinButton } from "@/components/campeonato/copy-checkin-button";
import { StageSelect } from "@/components/campeonato/stage-select";
import { Avatar } from "@/components/ui/avatar";
import { StageProgress } from "@/components/campeonato/stage-progress";
import { STAGE_LABEL } from "@/lib/championship-stage";
import { RulesTab } from "@/components/campeonato/rules-tab";
import { VotingPanel, type VotingCandidate } from "@/components/campeonato/voting-panel";
import { PotsView } from "@/components/campeonato/pots-view";
import { DrawPanel } from "@/components/campeonato/draw-panel";
import { TeamsView, type TeamWithMembers } from "@/components/campeonato/teams-view";
import { CompleteProfileButton } from "@/components/campeonato/complete-profile-button";
import { isProfileComplete } from "@/lib/championship-profile";
import { buildPots, checkDraw, isVotable, type PotCandidate, type PotOverrides } from "@/lib/championship-pots";
import { formatDateTimeBrt } from "@/lib/brt";
import type { ChampionshipWithDetails } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG = {
  active: { label: "Inscrições abertas", bg: "rgba(52,211,153,0.15)", color: "#34d399" },
  closed: { label: "Encerrado", bg: "rgba(255,255,255,0.08)", color: "#8e8e93" },
};

export default async function ChampionshipPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("championships")
    .select(`*, profiles(*), championship_participants(*, profiles(*))`)
    .eq("id", id)
    .single();

  if (!data) notFound();

  const { data: myProfile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  const admin = createAdminClient();
  const { data: adminCheck } = user
    ? await admin
        .from("authorized_phones")
        .select("is_admin")
        .eq("auth_user_id", user.id)
        .maybeSingle()
    : { data: null };
  const isAdmin = adminCheck?.is_admin ?? false;

  const championship = data as ChampionshipWithDetails;
  const status =
    championship.status === "active"
      ? { ...STATUS_CONFIG.active, label: `Etapa: ${STAGE_LABEL[championship.stage]}` }
      : STATUS_CONFIG.closed;
  const checkins = [...championship.championship_participants].sort(
    (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  );
  const isCheckedIn = user ? checkins.some((c) => c.user_id === user.id) : false;
  const dateStr = championship.date
    ? format(parseISO(championship.date), "EEEE, dd 'de' MMMM", { locale: ptBR })
    : null;
  const hasPaymentConfig = !!championship.pix_key || championship.price_per_person != null;
  const myCheckin = user ? checkins.find((c) => c.user_id === user.id) : undefined;

  // Times: votação (inscritos) e potes (depois da votação; admin vê a prévia durante)
  const stage = championship.stage;
  const votingOpen = stage === "voting" && championship.status === "active";
  const showPots = stage === "draw" || stage === "table" || stage === "games" || (votingOpen && isAdmin);

  const candidates: VotingCandidate[] = checkins
    .filter((c) => isVotable(c.profiles) && c.user_id !== user?.id)
    .map((c) => ({
      id: c.user_id,
      name: c.profiles.name,
      avatar_url: c.profiles.avatar_url,
      age: c.profiles.age,
      height_cm: c.profiles.height_cm,
    }));

  let myScores: Record<string, number> = {};
  if (votingOpen && user && isCheckedIn) {
    const { data: myVotes } = await supabase
      .from("championship_votes")
      .select("candidate_id, score")
      .eq("championship_id", id)
      .eq("voter_id", user.id);
    myScores = Object.fromEntries((myVotes ?? []).map((v) => [v.candidate_id, v.score]));
  }

  let pots = null;
  if (showPots) {
    const { data: allVotes } = await admin
      .from("championship_votes")
      .select("candidate_id, score")
      .eq("championship_id", id);
    const potCandidates: PotCandidate[] = checkins.map((c) => ({
      id: c.user_id,
      name: c.profiles.name,
      avatar_url: c.profiles.avatar_url,
      gender: c.profiles.gender,
      joined_at: c.joined_at,
    }));
    const { data: overrideRows } = await admin
      .from("championship_pot_overrides")
      .select("user_id, pot")
      .eq("championship_id", id);
    const overrides: PotOverrides = Object.fromEntries(
      (overrideRows ?? []).map((o) => [o.user_id, o.pot])
    );
    pots = buildPots(potCandidates, allVotes ?? [], overrides);
  }
  const drawCheck = pots ? checkDraw(pots) : null;

  // Times sorteados
  let teams: TeamWithMembers[] = [];
  if (stage === "draw" || stage === "table" || stage === "games") {
    const [{ data: teamRows }, { data: memberRows }] = await Promise.all([
      supabase.from("championship_teams").select("id, name").eq("championship_id", id),
      supabase
        .from("championship_team_members")
        .select("team_id, user_id, pot")
        .eq("championship_id", id),
    ]);
    const byUser = new Map(checkins.map((c) => [c.user_id, c.profiles]));
    const potOrder = { girls: 0, A: 1, B: 2, C: 3 };
    teams = (teamRows ?? [])
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }))
      .map((t) => ({
        id: t.id,
        name: t.name,
        members: (memberRows ?? [])
          .filter((m) => m.team_id === t.id)
          .sort((a, b) => potOrder[a.pot] - potOrder[b.pot])
          .map((m) => ({
            user_id: m.user_id,
            name: byUser.get(m.user_id)?.name ?? null,
            avatar_url: byUser.get(m.user_id)?.avatar_url ?? null,
            pot: m.pot,
          })),
      }));
  }
  const needsProfile =
    isCheckedIn && !isProfileComplete(myProfile) && (stage === "registration" || stage === "voting" || stage === "draw");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Hero header */}
      <div style={{ background: "var(--color-brand)" }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center gap-3">
          <Link href="/campeonato">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
            >
              <ArrowLeft size={16} />
            </button>
          </Link>
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-syne)" }}
          >
            Campeonato
          </span>
          {isAdmin && (
            <Link href={`/campeonato/${id}/edit`} className="ml-auto">
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
              >
                <Pencil size={15} />
              </button>
            </Link>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1
              className="text-2xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "white" }}
            >
              {championship.title}
            </h1>
            <span
              className="shrink-0 text-xs font-bold px-3 py-1 rounded-full mt-1"
              style={{ background: status.bg, color: status.color, fontFamily: "var(--font-syne)" }}
            >
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {dateStr && <span className="capitalize">{dateStr}</span>}
            {championship.time && (
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {championship.time.slice(0, 5)}
              </span>
            )}
            {championship.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {championship.location}
                {championship.court ? ` · ${championship.court}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={13} />
              {checkins.length} inscritos
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>
              por {(championship.profiles.name ?? "Alguém").split(" ")[0]}
            </span>
          </div>

          <div className="mt-4">
            <StageProgress stage={championship.stage} closed={championship.status === "closed"} onDark />
          </div>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap gap-2">
              <StageSelect championshipId={championship.id} stage={championship.stage} />
              <StatusButton championshipId={championship.id} status={championship.status} />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-4 pb-10">
        <Tabs defaultValue="inscricao">
          <TabsList
            className="w-full mb-5 p-1 rounded-xl h-auto gap-1"
            style={{ background: "#1a1a1a" }}
          >
            <TabsTrigger
              value="inscricao"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all data-[state=active]:shadow-sm"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Inscrição
            </TabsTrigger>
            <TabsTrigger
              value="times"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Times
            </TabsTrigger>
            <TabsTrigger
              value="tabela"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Tabela
            </TabsTrigger>
            <TabsTrigger
              value="regras"
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Regras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inscricao" className="space-y-4">
            {user ? (
              championship.status === "active" && (championship.stage === "registration" || isCheckedIn) ? (
                <>
                  {championship.stage === "registration" ? (
                    <CheckinButton
                      championshipId={championship.id}
                      checkedIn={isCheckedIn}
                      userId={user.id}
                      profile={myProfile}
                    />
                  ) : null}
                  {isCheckedIn && hasPaymentConfig && myCheckin?.payment_status === "pending" && (
                    <div className="flex justify-center">
                      <CheckinPaymentButton
                        championshipId={championship.id}
                        pricePerPerson={championship.price_per_person}
                        pixKey={championship.pix_key}
                        proofUrl={myCheckin.proof_url}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  As inscrições deste campeonato estão encerradas
                </p>
              )
            ) : (
              <Link href={`/auth?redirect=/campeonato/${championship.id}`}>
                <button
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
                >
                  Entrar para fazer check-in
                </button>
              </Link>
            )}

            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-bold tracking-wide uppercase"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
                >
                  Lista de inscritos
                </h3>
                {checkins.length > 0 && (
                  <CopyCheckinButton
                    championshipId={championship.id}
                    players={checkins.map((c) => ({ name: c.profiles.name }))}
                  />
                )}
              </div>

              {checkins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum inscrito ainda
                </p>
              ) : (
                <div className="space-y-0.5">
                  {checkins.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 py-2.5 rounded-lg px-2 -mx-2 transition-colors hover:bg-muted/50"
                    >
                      <span
                        className="w-5 text-xs font-bold text-center text-muted-foreground shrink-0"
                        style={{ fontFamily: "var(--font-syne)" }}
                      >
                        {i + 1}
                      </span>
                      <Link href={`/perfil/${c.user_id}`} className="shrink-0">
                        <Avatar name={c.profiles.name} url={c.profiles.avatar_url} size={34} />
                      </Link>
                      <span className="flex-1 font-medium text-sm truncate">{c.profiles.name ?? "—"}</span>

                      {hasPaymentConfig && (
                        c.payment_status === "confirmed" ? (
                          <span className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "#c4ff45", color: "#0c2b1a", fontFamily: "var(--font-syne)" }}
                            >
                              Pago
                            </span>
                            {c.proof_url && (
                              <a
                                href={c.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs underline text-muted-foreground"
                              >
                                comprovante
                              </a>
                            )}
                          </span>
                        ) : isAdmin ? (
                          <span className="flex items-center gap-2 shrink-0">
                            {c.proof_url && (
                              <a
                                href={c.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs underline text-muted-foreground"
                              >
                                comprovante
                              </a>
                            )}
                            <ConfirmCheckinButton championshipId={championship.id} participantId={c.id} />
                          </span>
                        ) : (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: "#fef3c7", color: "#92400e", fontFamily: "var(--font-syne)" }}
                          >
                            Pendente
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="times" className="space-y-4">
            {needsProfile && user && <CompleteProfileButton userId={user.id} profile={myProfile} />}

            {stage === "registration" && (
              <InfoCard
                emoji="🗳️"
                title="A votação ainda não começou"
                text="Quando as inscrições fecharem, todo mundo vota nos jogadores para montar os potes."
              />
            )}

            {votingOpen &&
              (isCheckedIn ? (
                <VotingPanel
                  championshipId={championship.id}
                  candidates={candidates}
                  initialScores={myScores}
                  deadline={formatDateTimeBrt(championship.voting_end)}
                />
              ) : (
                <InfoCard
                  emoji="🗳️"
                  title="Votação aberta"
                  text="Só quem está inscrito pode votar."
                />
              ))}

            {stage === "voting" && championship.status !== "active" && (
              <InfoCard emoji="🗳️" title="Votação encerrada" text="Aguarde o sorteio dos times." />
            )}

            {isAdmin && stage === "voting" && drawCheck?.message && (
              <p
                className="text-xs rounded-lg p-3"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
              >
                Sorteio: {drawCheck.message}
              </p>
            )}

            {isAdmin && stage === "draw" && pots && drawCheck && (
              <DrawPanel
                championshipId={championship.id}
                hasTeams={teams.length > 0}
                canDraw={drawCheck.ok && championship.status === "active"}
                problem={drawCheck.message}
                unassignedNames={pots.unassigned.map((p) => p.name ?? "—")}
              />
            )}

            {teams.length > 0 && (
              <>
                <h3
                  className="text-sm font-bold tracking-wide uppercase pt-2"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
                >
                  Times
                </h3>
                <TeamsView teams={teams} />
              </>
            )}

            {pots && (
              <>
                <h3
                  className="text-sm font-bold tracking-wide uppercase pt-2"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
                >
                  {stage === "voting" ? "Prévia dos potes (só admin)" : "Potes"}
                </h3>
                <PotsView
                  championshipId={championship.id}
                  pots={pots}
                  showStats={isAdmin}
                  canMove={isAdmin && championship.status === "active" && (stage === "voting" || stage === "draw")}
                />
              </>
            )}

            {stage === "draw" && teams.length === 0 && !isAdmin && (
              <InfoCard emoji="🎲" title="Sorteio" text="Os times serão montados em breve." />
            )}
          </TabsContent>

          <TabsContent value="tabela">
            <ComingSoon />
          </TabsContent>

          <TabsContent value="regras">
            <RulesTab
              currentStage={championship.stage}
              dates={{
                registration_start: championship.registration_start,
                registration_end: championship.registration_end,
                voting_end: championship.voting_end,
                draw_at: championship.draw_at,
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function InfoCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm text-center py-10 space-y-2">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="font-semibold text-base" style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}>
        {title}
      </p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm text-center py-16 space-y-2">
      <div className="text-4xl mb-2">🚧</div>
      <p className="font-semibold text-base" style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}>
        Em breve
      </p>
      <p className="text-sm text-muted-foreground">Essa parte ainda está sendo construída</p>
    </div>
  );
}
