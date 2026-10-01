"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { saveMyChampionshipProfile } from "@/app/campeonato/[id]/actions";
import type { Profile } from "@/lib/supabase/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profile: Profile | null;
  submitLabel: string;
  // chamado depois que o perfil foi salvo; quem abriu o diálogo decide o que fazer (e fechar)
  onSaved: () => void | Promise<void>;
}

const SYNE = { fontFamily: "var(--font-syne)" } as const;

export function ProfileDialog({ open, onOpenChange, userId, profile, submitLabel, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    age: profile?.age != null ? String(profile.age) : "",
    height_cm: profile?.height_cm != null ? String(profile.height_cm) : "",
    weight_kg: profile?.weight_kg != null ? String(profile.weight_kg) : "",
    gender: (profile?.gender ?? "") as "" | "F" | "M",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.gender) {
      toast.error("Escolha o gênero");
      return;
    }
    if (!photo && !profile?.avatar_url) {
      toast.error("Adicione uma foto");
      return;
    }
    setSaving(true);
    try {
      let avatar_url: string | null = null;
      if (photo) {
        const supabase = createClient();
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, photo, { upsert: true });
        if (upErr) {
          toast.error("Erro ao enviar a foto");
          return;
        }
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = `${data.publicUrl}?v=${Date.now()}`;
      }

      const res = await saveMyChampionshipProfile({
        age: parseInt(form.age, 10),
        height_cm: parseInt(form.height_cm, 10),
        weight_kg: parseFloat(form.weight_kg.replace(",", ".")),
        gender: form.gender,
        avatar_url,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl px-3 py-2.5 text-sm outline-none bg-muted/50 focus:ring-2 focus:ring-[var(--color-brand)]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
          <DialogDescription>
            Ele será usado na votação dos times. Só precisa preencher uma vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <label className="space-y-1 text-xs font-semibold" style={SYNE}>
              Idade
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={5}
                max={100}
                required
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-xs font-semibold" style={SYNE}>
              Altura (cm)
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={100}
                max={250}
                required
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-xs font-semibold" style={SYNE}>
              Peso (kg)
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                step="0.1"
                min={20}
                max={300}
                required
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold" style={SYNE}>
              Gênero
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["F", "Feminino"],
                  ["M", "Masculino"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, gender: value })}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    background: form.gender === value ? "var(--color-brand)" : "rgba(255,255,255,0.06)",
                    color: form.gender === value ? "white" : "inherit",
                    ...SYNE,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold" style={SYNE}>
              Foto
            </span>
            <label
              className="flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: photo ? "1.5px solid var(--color-brand)" : "1.5px dashed #666",
                ...SYNE,
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              {photo
                ? photo.name.slice(0, 28)
                : profile?.avatar_url
                  ? "Trocar foto (opcional)"
                  : "Anexar foto"}
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--color-brand)", color: "white", ...SYNE }}
          >
            {saving ? "Salvando..." : submitLabel}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
