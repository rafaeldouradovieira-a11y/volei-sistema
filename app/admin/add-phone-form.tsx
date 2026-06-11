"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addPhone } from "./actions";
import { formatPhone, normalizePhone } from "@/lib/phone";
import type { AuthorizedPhone } from "@/lib/supabase/types";

type Mode = "player" | "guest";

interface AddPhoneFormProps {
  existingPhones: AuthorizedPhone[];
  onSuccess: () => void;
}

export function AddPhoneForm({ existingPhones, onSuccess }: AddPhoneFormProps) {
  const [mode, setMode] = useState<Mode>("player");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [invitedById, setInvitedById] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
  }

  const displayPhone =
    phone.length >= 10
      ? formatPhone(normalizePhone(phone))
      : phone.length > 0
      ? `(${phone.slice(0, 2)}) ${phone.slice(2)}`
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const result = await addPhone({
      phone,
      display_name: name || undefined,
      is_admin: mode === "player" ? isAdmin : false,
      invited_by_id: mode === "guest" && invitedById ? invitedById : null,
    });

    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Número adicionado com sucesso!");
    setPhone("");
    setName("");
    setIsAdmin(false);
    setInvitedById("");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode toggle */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "oklch(0.91 0.01 85)" }}
      >
        {(["player", "guest"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              fontFamily: "var(--font-syne)",
              background: mode === m ? "var(--color-brand)" : "transparent",
              color: mode === m ? "var(--color-lime)" : "oklch(0.50 0.03 150)",
            }}
          >
            {m === "player" ? "Jogador" : "Convidado"}
          </button>
        ))}
      </div>

      {/* Phone */}
      <FormField label="WhatsApp">
        <input
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          value={displayPhone}
          onChange={handlePhoneChange}
          required
        />
      </FormField>

      {/* Name (optional) */}
      <FormField label="Nome (opcional)">
        <input
          type="text"
          placeholder="João Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      {/* Mode-specific fields */}
      {mode === "player" && (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            className="w-10 h-6 rounded-full flex items-center transition-all duration-200 px-0.5"
            style={{
              background: isAdmin ? "var(--color-brand)" : "oklch(0.80 0.02 150)",
            }}
            onClick={() => setIsAdmin(!isAdmin)}
          >
            <div
              className="w-5 h-5 rounded-full bg-white transition-all duration-200 shadow-sm"
              style={{ transform: isAdmin ? "translateX(16px)" : "translateX(0)" }}
            />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
          >
            Admin
          </span>
        </label>
      )}

      {mode === "guest" && (
        <FormField label="Convidado por">
          <select
            required
            value={invitedById}
            onChange={(e) => setInvitedById(e.target.value)}
            style={{ background: "transparent", width: "100%", outline: "none" }}
          >
            <option value="">Selecione quem convidou</option>
            {existingPhones.map((ap) => (
              <option key={ap.id} value={ap.id}>
                {ap.display_name
                  ? `${ap.display_name} · ${formatPhone(ap.phone)}`
                  : formatPhone(ap.phone)}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "var(--color-brand)",
          color: "var(--color-lime)",
          fontFamily: "var(--font-syne)",
        }}
      >
        {loading ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-semibold tracking-widest uppercase"
        style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
      >
        {label}
      </label>
      <div
        className="field-input"
        style={{ borderBottom: "2px solid var(--color-brand)" }}
      >
        {children}
      </div>
    </div>
  );
}
