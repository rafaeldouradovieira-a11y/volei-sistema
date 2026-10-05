"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Trophy, Award } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/lib/supabase/types";

interface HeaderProps {
  profile: Profile | null;
  isAdmin?: boolean;
}

export function Header({ profile, isAdmin = false }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const firstName = profile?.name?.split(" ")[0] ?? "Usuário";
  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: "var(--color-brand)" }}
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: "var(--color-lime)" }}
          >
            🏐
          </div>
          <span
            style={{
              color: "white",
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              fontSize: "1rem",
            }}
          >
            VÔLEI
            <span style={{ color: "var(--color-lime)" }}>.SYSTEM</span>
          </span>
        </Link>

        {/* User area */}
        {profile ? (
          <div className="flex items-center gap-2">
            <Link
              href="/campeonato"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.1)", color: "var(--color-lime)" }}
              title="Campeonato"
            >
              <Award size={14} />
            </Link>
            <Link
              href="/ranking"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.1)", color: "var(--color-lime)" }}
              title="Ranking de check-ins"
            >
              <Trophy size={14} />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-90"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "var(--color-lime)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                Admin
              </Link>
            )}
            <Link
              href={`/perfil/${profile.id}`}
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors hover:bg-white/15"
              style={{ background: "rgba(255,255,255,0.08)" }}
              title="Meu perfil"
            >
              <Avatar name={profile.name} url={profile.avatar_url} size={26} />
              <span className="text-sm text-white/80">{firstName}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/auth")}
            className="text-sm font-medium px-4 py-1.5 rounded-full transition-all"
            style={{
              background: "var(--color-lime)",
              color: "var(--color-brand)",
              fontFamily: "var(--font-syne)",
              fontWeight: 600,
            }}
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}
