import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CheckCircle2, Trophy } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import type { ChampionshipWithDetails } from "@/lib/supabase/types";

const SYNE = { fontFamily: "var(--font-syne)" } as const;

export function ChampionshipCta({
  championship,
  loggedIn,
  checkedIn,
}: {
  championship: ChampionshipWithDetails;
  loggedIn: boolean;
  checkedIn: boolean;
}) {
  const people = championship.championship_participants;
  const href = loggedIn
    ? `/campeonato/${championship.id}`
    : `/auth?redirect=/campeonato/${championship.id}`;
  const dateLabel = championship.date
    ? format(parseISO(championship.date), "dd 'de' MMMM", { locale: ptBR })
    : null;

  return (
    <Link href={href} className="block group mb-5">
      <div
        className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          {checkedIn ? <CheckCircle2 size={24} color="white" /> : <Trophy size={24} color="white" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70" style={SYNE}>
            {checkedIn ? "Você está inscrito" : "Inscrições abertas"}
          </p>
          <h2 className="text-lg font-extrabold leading-tight text-white truncate" style={SYNE}>
            {championship.title}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
            {people.length > 0 && (
              <AvatarStack
                people={people.map((c) => ({ name: c.profiles.name, avatar_url: c.profiles.avatar_url }))}
                max={3}
                size={20}
              />
            )}
            <span>
              {people.length} inscritos{dateLabel ? ` · ${dateLabel}` : ""}
            </span>
          </div>
        </div>

        <span
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold bg-white"
          style={{ ...SYNE, color: "#b91c1c" }}
        >
          {checkedIn ? "Ver" : "Inscrever-se"}
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
