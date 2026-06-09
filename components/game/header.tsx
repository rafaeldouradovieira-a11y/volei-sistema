"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
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

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏐</span>
          <span className="font-semibold text-lg">Vôlei System</span>
        </div>
        {profile ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <User size={14} />
              <span>{profile.name.split(" ")[0]}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-500"
            >
              <LogOut size={14} />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/auth")}
          >
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
}
