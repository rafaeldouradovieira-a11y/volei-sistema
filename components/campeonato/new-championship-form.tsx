"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function NewChampionshipForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/campeonato/new"); return; }

      const { data, error } = await supabase
        .from("championships")
        .insert({
          organizer_id: user.id,
          title,
          date: date || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Campeonato criado!");
      router.push(`/campeonato/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar campeonato");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <header
        className="sticky top-0 z-10"
        style={{ background: "var(--color-brand)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/campeonato">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1
            className="font-extrabold text-base tracking-tight"
            style={{ fontFamily: "var(--font-syne)", color: "var(--color-lime)" }}
          >
            CRIAR CAMPEONATO
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-5">
            <Field label="Título *">
              <input
                name="title"
                placeholder="Ex: Campeonato de Verão"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>
            <Field label="Data (opcional)">
              <input
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>

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
            {loading ? "Criando..." : "CRIAR CAMPEONATO"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
