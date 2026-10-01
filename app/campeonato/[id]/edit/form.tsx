"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { isoToLocalInput, localInputToIso } from "@/lib/brt";
import { updateChampionship } from "@/app/campeonato/[id]/actions";
import type { Championship } from "@/lib/supabase/types";

interface Props {
  championship: Championship;
}

export default function EditChampionshipForm({ championship }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: championship.title,
    date: championship.date ?? "",
    time: championship.time?.slice(0, 5) ?? "",
    location: championship.location ?? "",
    court: championship.court ?? "",
    price_per_person: championship.price_per_person != null ? String(championship.price_per_person) : "",
    pix_key: championship.pix_key ?? "",
    registration_start: championship.registration_start ?? "",
    registration_end: championship.registration_end ?? "",
    voting_end: isoToLocalInput(championship.voting_end),
    draw_at: isoToLocalInput(championship.draw_at),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateChampionship(championship.id, {
        title: form.title,
        date: form.date || null,
        time: form.time || null,
        location: form.location || null,
        court: form.court || null,
        price_per_person: form.price_per_person ? parseFloat(form.price_per_person) : null,
        pix_key: form.pix_key || null,
        registration_start: form.registration_start || null,
        registration_end: form.registration_end || null,
        voting_end: localInputToIso(form.voting_end),
        draw_at: localInputToIso(form.draw_at),
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Campeonato atualizado!");
      router.push(`/campeonato/${championship.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <header className="sticky top-0 z-10" style={{ background: "var(--color-brand)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={`/campeonato/${championship.id}`}>
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
            EDITAR CAMPEONATO
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Informações básicas">
            <Field label="Título *">
              <input name="title" value={form.title} onChange={handleChange} required />
            </Field>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Data (opcional)">
                <input name="date" type="date" value={form.date} onChange={handleChange} />
              </Field>
              <Field label="Horário (opcional)">
                <input name="time" type="time" value={form.time} onChange={handleChange} />
              </Field>
            </div>
          </Section>

          <Section title="Datas das fases">
            <div className="grid grid-cols-2 gap-6">
              <Field label="Inscrição — início">
                <input name="registration_start" type="date" value={form.registration_start} onChange={handleChange} />
              </Field>
              <Field label="Inscrição — fim">
                <input name="registration_end" type="date" value={form.registration_end} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Votação — termina em">
              <input name="voting_end" type="datetime-local" value={form.voting_end} onChange={handleChange} />
            </Field>
            <Field label="Sorteio dos times — data e hora">
              <input name="draw_at" type="datetime-local" value={form.draw_at} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Local">
            <Field label="Nome do local (opcional)">
              <input name="location" placeholder="Ex: Arena Beach Club" value={form.location} onChange={handleChange} />
            </Field>
            <Field label="Quadra (opcional)">
              <input name="court" placeholder="Ex: Quadra 3" value={form.court} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Pagamento">
            <div className="grid grid-cols-2 gap-6">
              <Field label="Valor por pessoa (R$)">
                <input
                  name="price_per_person"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.price_per_person}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Chave PIX">
                <input name="pix_key" placeholder="CPF, e-mail, telefone..." value={form.pix_key} onChange={handleChange} />
              </Field>
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
