"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

interface HeaderProps {
  profile: Profile | null;
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const initials = profile?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: "var(--color-brand)" }}
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: "var(--color-lime)" }}
          >
            🏐
          </div>
          <span
            className="font-heading font-700 text-base tracking-tight"
            style={{
              color: "white",
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            VÔLEI
            <span style={{ color: "var(--color-lime)" }}>.SYSTEM</span>
          </span>
        </div>

        {/* User area */}
        {profile ? (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "var(--color-lime)",
                  color: "var(--color-brand)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                {initials}
              </div>
              <span className="text-sm text-white/80">
                {profile.name.split(" ")[0]}
              </span>
            </div>
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
