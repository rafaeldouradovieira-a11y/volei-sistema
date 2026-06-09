"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Step = "email" | "otp" | "profile";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      toast.success("Código enviado para seu e-mail!");
      setStep("otp");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar código");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Usuário não encontrado");
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      if (profile) {
        router.push(redirectTo);
      } else {
        setStep("profile");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        name: name.trim(),
        phone: phone.trim(),
      });
      if (error) throw error;
      toast.success("Cadastro concluído!");
      router.push(redirectTo);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["email", "otp", "profile"] as const;
  const stepIndex = steps.indexOf(step);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: "var(--color-brand)" }}
        >
          🏐
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{
            fontFamily: "var(--font-syne)",
            color: "var(--color-brand)",
          }}
        >
          VÔLEI<span style={{ color: "oklch(0.5 0.12 127)" }}>.SYSTEM</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "email" && "Entre com seu e-mail"}
          {step === "otp" && `Código enviado para ${email}`}
          {step === "profile" && "Quase lá! Complete seu perfil"}
        </p>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 mb-8">
        {steps.map((s, i) => (
          <div
            key={s}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === stepIndex ? "24px" : "8px",
              background: i <= stepIndex ? "var(--color-brand)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {/* Forms */}
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{
                fontFamily: "var(--font-syne)",
                color: "var(--color-brand)",
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-0 py-3 bg-transparent text-base outline-none transition-colors placeholder:text-muted-foreground/50"
              style={{
                borderBottom: "2px solid var(--color-brand)",
                color: "var(--color-brand)",
              }}
            />
          </div>
          <SubmitButton loading={loading} label="Continuar" />
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              Código de 6 dígitos
            </label>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              autoFocus
              className="w-full py-3 bg-transparent text-4xl font-extrabold tracking-[0.3em] outline-none text-center"
              style={{
                borderBottom: "2px solid var(--color-brand)",
                color: "var(--color-brand)",
                fontFamily: "var(--font-syne)",
              }}
            />
          </div>
          <SubmitButton loading={loading} label="Verificar" />
          <button
            type="button"
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setStep("email")}
          >
            ← Usar outro e-mail
          </button>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={handleCreateProfile} className="space-y-6">
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              Nome completo
            </label>
            <input
              type="text"
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-0 py-3 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
              style={{
                borderBottom: "2px solid var(--color-brand)",
                color: "var(--color-brand)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              WhatsApp
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-0 py-3 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
              style={{
                borderBottom: "2px solid var(--color-brand)",
                color: "var(--color-brand)",
              }}
            />
          </div>
          <SubmitButton loading={loading} label="Entrar no sistema" />
        </form>
      )}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-6"
      style={{
        background: "var(--color-brand)",
        color: "var(--color-lime)",
        fontFamily: "var(--font-syne)",
        letterSpacing: "0.02em",
      }}
    >
      {loading ? "Aguarde..." : label}
    </button>
  );
}
