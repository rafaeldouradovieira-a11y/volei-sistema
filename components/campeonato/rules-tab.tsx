import {
  ClipboardList,
  Vote,
  Shuffle,
  CalendarDays,
  Trophy,
  Wallet,
  User,
  Camera,
  Star,
  type LucideIcon,
} from "lucide-react";
import { formatDateTimeBrt, formatDayMonth } from "@/lib/brt";
import { STAGES, STAGE_LABEL, type ChampionshipStage } from "@/lib/championship-stage";

const SYNE = { fontFamily: "var(--font-syne)" } as const;

export interface RulesDates {
  registration_start: string | null;
  registration_end: string | null;
  voting_end: string | null;
  draw_at: string | null;
}

const TBD = "Data a definir";

const POTS = [
  { name: "Meninas", emoji: "👩", hint: "Todas as meninas" },
  { name: "Homens A", emoji: "🔥", hint: "Maiores notas" },
  { name: "Homens B", emoji: "⚡", hint: "Notas do meio" },
  { name: "Homens C", emoji: "🌱", hint: "Menores notas" },
];

export function RulesTab({
  currentStage,
  dates,
}: {
  currentStage: ChampionshipStage;
  dates: RulesDates;
}) {
  const currentIndex = STAGES.indexOf(currentStage);

  const start = formatDayMonth(dates.registration_start);
  const end = formatDayMonth(dates.registration_end);
  const registrationWhen =
    start && end ? `${start} a ${end}` : end ? `Até ${end}` : start ? `A partir de ${start}` : TBD;
  const votingEnd = formatDateTimeBrt(dates.voting_end);
  const votingWhen = votingEnd ? `Até ${votingEnd}` : TBD;
  const drawWhen = formatDateTimeBrt(dates.draw_at) ?? TBD;

  const STEPS: { icon: LucideIcon; label: string; when: string }[] = [
    { icon: ClipboardList, label: "Inscrição", when: registrationWhen },
    { icon: Vote, label: "Votação", when: votingWhen },
    { icon: Shuffle, label: "Sorteio", when: drawWhen },
    { icon: CalendarDays, label: "Tabela", when: "Após o sorteio" },
    { icon: Trophy, label: "Jogos", when: "Fase de grupos + playoffs" },
  ];

  return (
    <div className="space-y-4">
      {/* Linha do tempo */}
      <section className="bg-card rounded-2xl p-5 shadow-sm">
        <SectionTitle>Etapas do campeonato</SectionTitle>
        <ol className="relative">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast && (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  />
                )}
                <span
                  className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i <= currentIndex ? "var(--color-brand)" : "rgba(255,255,255,0.08)",
                    color: i <= currentIndex ? "white" : "rgba(255,255,255,0.6)",
                  }}
                >
                  <Icon size={15} />
                </span>
                <div className="flex-1 flex items-center justify-between gap-2 min-h-8">
                  <span className="font-bold text-sm" style={SYNE}>
                    {i + 1}. {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-right">{step.when}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-muted-foreground mt-4">
          Estamos na etapa{" "}
          <strong className="text-foreground">
            {currentIndex + 1}. {STAGE_LABEL[currentStage]}
          </strong>
          .
        </p>
      </section>

      {/* 1. Inscrição */}
      <RuleCard
        icon={ClipboardList}
        step="1"
        title="Inscrição"
        when={registrationWhen}
      >
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.12)" }}
        >
          <Wallet size={22} style={{ color: "var(--color-brand)" }} />
          <div>
            <p className="text-2xl font-extrabold leading-none" style={SYNE}>
              R$ 20
            </p>
            <p className="text-xs text-muted-foreground mt-1">por pessoa</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 mb-2">
          Preencha seu perfil na inscrição — ele é usado na votação:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: User, text: "Idade" },
            { icon: User, text: "Altura" },
            { icon: User, text: "Peso" },
            { icon: User, text: "Gênero" },
            { icon: Camera, text: "Foto" },
          ].map((f) => (
            <Chip key={f.text} icon={f.icon}>
              {f.text}
            </Chip>
          ))}
        </div>
      </RuleCard>

      {/* 2. Votação */}
      <RuleCard
        icon={Vote}
        step="2"
        title="Votação pros times"
        when={votingWhen}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Com todos inscritos, cada um dá uma nota para os outros participantes:
        </p>
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className="flex-1 h-10 rounded-lg flex items-center justify-center gap-0.5 font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.08)", ...SYNE }}
            >
              {n}
              <Star size={11} style={{ color: "var(--color-brand)" }} fill="currentColor" />
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Notas de 1 a 5 · você pode <strong className="text-foreground">pular</strong> quem
          não conhece.
        </p>
        <ul className="text-xs text-muted-foreground mt-3 space-y-1.5 list-disc pl-4">
          <li>Todo inscrito vota.</li>
          <li>
            Só os homens recebem nota — as meninas já têm um pote só delas. Você não vota em si
            mesmo.
          </li>
          <li>Sem gênero no perfil, você fica fora dos potes — complete o perfil.</li>
          <li>Seus votos são secretos.</li>
          <li>
            Vale a <strong className="text-foreground">média</strong> das notas recebidas.
          </li>
        </ul>

        <p className="text-sm text-muted-foreground mt-5 mb-3">
          Depois da votação, todos vão para <strong className="text-foreground">4 potes</strong>{" "}
          conforme as notas:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {POTS.map((p) => (
            <div
              key={p.name}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div className="text-2xl mb-1">{p.emoji}</div>
              <p className="font-bold text-sm" style={SYNE}>
                {p.name}
              </p>
              <p className="text-xs text-muted-foreground">{p.hint}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Os homens são divididos em partes iguais. Ex.: 15 homens = 5 em cada pote. Se sobrar,
          o pote A fica com o extra primeiro.
        </p>

        <p className="text-sm font-bold mt-5 mb-2" style={SYNE}>
          Empate na média? Sem sorteio:
        </p>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
          <li>Quem recebeu mais votos (mais gente opinou, nota mais confiável).</li>
          <li>Quem recebeu mais notas 5.</li>
          <li>Quem se inscreveu primeiro.</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-3">
          Se precisar, o admin pode ajustar os potes movendo alguém de um pote para outro antes do
          sorteio.
        </p>
      </RuleCard>

      {/* 3. Sorteio */}
      <RuleCard icon={Shuffle} step="3" title="Sorteio dos times" when={drawWhen}>
        <p className="text-sm text-muted-foreground mb-3">
          O admin sorteia no sistema. Cada time é formado por:
        </p>
        <div className="flex items-center justify-between gap-1 text-center">
          {[
            { e: "👩", t: "1 menina" },
            { e: "🔥", t: "1 do Pote A" },
            { e: "⚡", t: "1 do Pote B" },
            { e: "🌱", t: "1 do Pote C" },
          ].map((m, i) => (
            <div key={m.t} className="flex items-center gap-1 flex-1">
              {i > 0 && <span className="text-muted-foreground text-sm">+</span>}
              <div
                className="flex-1 rounded-xl py-2.5 px-1"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div className="text-xl">{m.e}</div>
                <p className="text-[11px] font-semibold mt-0.5">{m.t}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">= times equilibrados 🤝</p>
      </RuleCard>

      {/* 4/5. Regras do jogo */}
      <RuleCard icon={Trophy} step="4" title="Tabela e jogos" when="Regras de jogo">
        <div className="grid grid-cols-2 gap-2">
          <Stat value="6" label="partidas por time" />
          <Stat value="3" label="melhores vão pros playoffs" />
          <Stat value="2" label="sets por partida" />
          <Stat value="10" label="pontos por set" />
        </div>

        <p className="text-sm font-bold mt-5 mb-2" style={SYNE}>
          Pontuação na tabela
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "rgba(239,68,68,0.12)" }}
          >
            <p className="text-3xl font-extrabold leading-none" style={{ ...SYNE, color: "var(--color-brand)" }}>
              3
            </p>
            <p className="text-xs text-muted-foreground mt-1">pontos por vitória</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            <p className="text-3xl font-extrabold leading-none" style={SYNE}>
              1
            </p>
            <p className="text-xs text-muted-foreground mt-1">ponto por empate</p>
          </div>
        </div>
      </RuleCard>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-bold tracking-wide uppercase mb-4"
      style={{ ...SYNE, color: "var(--color-brand)" }}
    >
      {children}
    </h3>
  );
}

function RuleCard({
  icon: Icon,
  step,
  title,
  when,
  children,
}: {
  icon: LucideIcon;
  step: string;
  title: string;
  when: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl p-5 shadow-sm">
      <header className="flex items-center gap-3 mb-4">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--color-brand)", color: "white" }}
        >
          <Icon size={17} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-base leading-tight" style={SYNE}>
            {step}. {title}
          </h3>
          <p className="text-xs text-muted-foreground">{when}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <Icon size={14} style={{ color: "var(--color-brand)" }} />
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
      <p className="text-2xl font-extrabold leading-none" style={{ ...SYNE, color: "var(--color-brand)" }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </div>
  );
}
