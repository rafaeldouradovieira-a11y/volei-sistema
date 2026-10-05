import { Avatar } from "@/components/ui/avatar";

export interface TeamWithMembers {
  id: string;
  name: string;
  members: { user_id: string; name: string | null; avatar_url: string | null; pot: "girls" | "A" | "B" | "C" }[];
}

const SYNE = { fontFamily: "var(--font-syne)" } as const;
const POT_LABEL = { girls: "Menina", A: "Pote A", B: "Pote B", C: "Pote C" } as const;

export function TeamsView({ teams }: { teams: TeamWithMembers[] }) {
  return (
    <div className="grid gap-3">
      {teams.map((team) => (
        <section key={team.id} className="bg-card rounded-2xl p-5 shadow-sm">
          <h3 className="font-extrabold text-base mb-3" style={{ ...SYNE, color: "var(--color-brand)" }}>
            {team.name}
          </h3>
          <div className="space-y-2">
            {team.members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <Avatar name={m.name} url={m.avatar_url} size={32} />
                <span className="flex-1 text-sm font-medium truncate">{m.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground shrink-0">{POT_LABEL[m.pot]}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
