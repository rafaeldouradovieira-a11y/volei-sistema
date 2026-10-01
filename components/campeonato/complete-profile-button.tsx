"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { ProfileDialog } from "@/components/campeonato/profile-dialog";
import type { Profile } from "@/lib/supabase/types";

export function CompleteProfileButton({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={{
          background: "rgba(251,191,36,0.15)",
          color: "#fbbf24",
          fontFamily: "var(--font-syne)",
        }}
      >
        <UserCog size={15} />
        Complete seu perfil para entrar nos potes
      </button>

      <ProfileDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        profile={profile}
        submitLabel="Salvar perfil"
        onSaved={() => {
          toast.success("Perfil salvo!");
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
