import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/game/header";
import { PhoneList } from "./phone-list";
import type { AuthorizedPhone, Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/admin");

  const admin = createAdminClient();

  // Verify admin status
  const { data: myPhone } = await admin
    .from("authorized_phones")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!myPhone?.is_admin) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch all authorized phones
  const { data: phones } = await admin
    .from("authorized_phones")
    .select("*")
    .order("created_at", { ascending: true });

  // Fetch profiles for phones that have auth_user_id
  const userIds = (phones ?? [])
    .filter((p) => p.auth_user_id)
    .map((p) => p.auth_user_id as string);

  const { data: profiles } =
    userIds.length > 0
      ? await admin.from("profiles").select("id, name, avatar_url").in("id", userIds)
      : { data: [] };

  const profileMap = new Map<string, Pick<Profile, "id" | "name" | "avatar_url">>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  // Unauthorized attempts count (last 30 days)
  const { count: attemptsCount } = await admin
    .from("unauthorized_attempts")
    .select("*", { count: "exact", head: true })
    .gte(
      "attempted_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );

  // Recent unauthorized attempts
  const { data: recentAttempts } = await admin
    .from("unauthorized_attempts")
    .select("*")
    .order("attempted_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen flex flex-col">
      <Header profile={profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-10">
        <div className="py-7">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-1"
            style={{
              color: "var(--color-lime)",
              fontFamily: "var(--font-syne)",
              filter: "brightness(0.6)",
            }}
          >
            Configurações
          </p>
          <h1
            className="text-4xl font-extrabold leading-none tracking-tight"
            style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
          >
            ADMIN
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard
            label="Usuários autorizados"
            value={phones?.length ?? 0}
          />
          <StatCard
            label="Tentativas bloqueadas"
            value={attemptsCount ?? 0}
            alert={(attemptsCount ?? 0) > 0}
          />
        </div>

        <PhoneList
          phones={(phones ?? []) as AuthorizedPhone[]}
          profileMap={Object.fromEntries(profileMap)}
          recentAttempts={recentAttempts ?? []}
        />
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: alert ? "oklch(0.97 0.02 25)" : "oklch(0.96 0.01 85)",
        border: `1px solid ${alert ? "oklch(0.85 0.06 25)" : "oklch(0.88 0.02 85)"}`,
      }}
    >
      <p
        className="text-3xl font-extrabold mb-1"
        style={{
          fontFamily: "var(--font-syne)",
          color: alert ? "oklch(0.45 0.12 25)" : "var(--color-brand)",
        }}
      >
        {value}
      </p>
      <p
        className="text-xs font-medium"
        style={{ color: alert ? "oklch(0.55 0.10 25)" : "oklch(0.55 0.04 150)" }}
      >
        {label}
      </p>
    </div>
  );
}
