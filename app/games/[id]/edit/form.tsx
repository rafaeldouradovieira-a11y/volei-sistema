"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateGame } from "@/app/games/[id]/actions";
import type { Game } from "@/lib/supabase/types";

interface Props {
  game: Game;
}

export default function EditGameForm({ game }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: game.title ?? "",
    date: game.date,
    time: game.time.slice(0, 5),
    location: game.location,
    court: game.court ?? "",
    duration_hours: String(game.duration_hours),
    max_players: String(game.max_players),
    price_total: game.price_total != null ? String(game.price_total) : "",
    pix_key: game.pix_key ?? "",
    allow_late_checkin: game.allow_late_checkin,
    allow_early_leave: game.allow_early_leave,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCheck(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateGame(game.id, {
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        court: form.court,
        duration_hours: parseFloat(form.duration_hours),
        max_players: parseInt(form.max_players),
        price_total: form.price_total ? parseFloat(form.price_total) : null,
        pix_key: form.pix_key || null,
        allow_late_checkin: form.allow_late_checkin,
        allow_early_leave: form.allow_early_leave,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Jogo atualizado!");
      router.push(`/games/${game.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <header className="sticky top-0 z-10" style={{ background: "var(--color-brand)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={`/games/${game.id}`}>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1
            className="font-extrabold text-base tracking-tight"
            style={{ fontFamily: "var(--font-syne)", color: "var(--color-lime)" }}
          >
            EDITAR VÔLEI
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Informações básicas">
            <Field label="Título (opcional)">
              <input name="title" placeholder="Ex: Vôlei da galera" value={form.title} onChange={handleChange} />
            </Field>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Data *">
                <input name="date" type="date" value={form.date} onChange={handleChange} required />
              </Field>
              <Field label="Horário *">
                <input name="time" type="time" value={form.time} onChange={handleChange} required />
              </Field>
            </div>
          </Section>

          <Section title="Local">
            <Field label="Nome do local *">
              <input name="location" placeholder="Ex: Arena Beach Club" value={form.location} onChange={handleChange} required />
            </Field>
            <Field label="Quadra (opcional)">
              <input name="court" placeholder="Ex: Quadra 3" value={form.court} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Configuração do jogo">
            <div className="grid grid-cols-3 gap-6">
              <Field label="Duração (h) *">
                <input name="duration_hours" type="number" min="0.5" max="8" step="0.5" value={form.duration_hours} onChange={handleChange} required />
              </Field>
              <Field label="Máx. jogadores *">
                <input name="max_players" type="number" min="2" max="100" value={form.max_players} onChange={handleChange} required />
              </Field>
              <Field label="Total (R$)">
                <input name="price_total" type="number" min="0" step="0.01" placeholder="0,00" value={form.price_total} onChange={handleChange} />
              </Field>
            </div>
          </Section>

          <Section title="Pagamento">
            <Field label="Chave PIX">
              <input name="pix_key" placeholder="CPF, e-mail, telefone ou chave aleatória" value={form.pix_key} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Regras">
            <div className="space-y-3">
              <CheckboxField
                name="allow_late_checkin"
                checked={form.allow_late_checkin}
                onChange={handleCheck}
                label="Checkin atrasado"
                description="Remove o limite de 1h para entrar na lista"
              />
              <CheckboxField
                name="allow_early_leave"
                checked={form.allow_early_leave}
                onChange={handleCheck}
                label="Saída liberada"
                description="Remove o limite de 2h para sair da lista"
              />
            </div>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: "var(--color-brand)",
              color: "var(--color-lime)",
              fontFamily: "var(--font-syne)",
              letterSpacing: "0.03em",
            }}
          >
            {loading ? "Salvando..." : "SALVAR ALTERAÇÕES"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
        >
          {title}
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-medium tracking-widest uppercase"
        style={{ fontFamily: "var(--font-syne)", color: "oklch(0.50 0.03 150)" }}
      >
        {label}
      </label>
      <div className="field-input" style={{ borderBottom: "2px solid var(--color-brand)" }}>
        {children}
      </div>
    </div>
  );
}

function CheckboxField({
  name, checked, onChange, label, description,
}: {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors select-none"
      style={{
        background: checked ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${checked ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
        style={{
          background: checked ? "var(--color-brand)" : "rgba(255,255,255,0.08)",
          border: `1.5px solid ${checked ? "var(--color-brand)" : "rgba(255,255,255,0.2)"}`,
        }}
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div>
        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-syne)", color: checked ? "var(--color-brand)" : "#f2f2f2" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#8e8e93" }}>{description}</p>
      </div>
    </label>
  );
}
