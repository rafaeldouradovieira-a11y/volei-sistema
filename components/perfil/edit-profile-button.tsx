"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { ProfileDialog } from "@/components/campeonato/profile-dialog";
import type { Profile } from "@/lib/supabase/types";

export function EditProfileButton({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "rgba(255,255,255,0.12)",
          color: "white",
          fontFamily: "var(--font-syne)",
        }}
      >
        <Camera size={14} />
        Editar perfil e foto
      </button>

      <ProfileDialog
        open={open}
        onOpenChange={setOpen}
        userId={profile.id}
        profile={profile}
        submitLabel="Salvar perfil"
        onSaved={() => {
          toast.success("Perfil atualizado!");
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
