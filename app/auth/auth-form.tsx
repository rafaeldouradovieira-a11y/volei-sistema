"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Mode = "login" | "register";
type Step = "credentials" | "profile";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("Erro ao autenticar");

      const { data: profile } = await supabase
        .from("profiles").select("id").eq("id", userId).single();

      if (profile) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setStep("profile");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar";
      if (msg.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Erro ao criar conta");
      setStep("profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      if (msg.includes("already registered")) {
        toast.error("Este e-mail já está cadastrado. Faça login.");
        setMode("login");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, faça login novamente");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        name: name.trim(),
        phone: phone.trim(),
      });
      if (error) throw error;

      toast.success("Cadastro concluído!");
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  }

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
          style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
        >
          VÔLEI<span style={{ color: "oklch(0.5 0.12 127)" }}>.SYSTEM</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "profile"
            ? "Quase lá! Complete seu perfil"
            : mode === "login"
            ? "Entre na sua conta"
            : "Crie sua conta"}
        </p>
      </div>

      {step === "credentials" && (
        <>
          {/* Mode toggle */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: "oklch(0.91 0.01 85)" }}
          >
            {(["login", "register"] as const).map((m) => (
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
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="space-y-6"
          >
            <FormField label="E-mail">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </FormField>

            <FormField label="Senha">
              <input
                type="password"
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </FormField>

            <SubmitButton
              loading={loading}
              label={mode === "login" ? "Entrar" : "Criar conta"}
            />
          </form>
        </>
      )}

      {step === "profile" && (
        <form onSubmit={handleProfile} className="space-y-6">
          <FormField label="Nome completo">
            <input
              type="text"
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <FormField label="WhatsApp">
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </FormField>

          <SubmitButton loading={loading} label="Entrar no sistema" />
        </form>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-semibold tracking-widest uppercase"
        style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
      >
        {label}
      </label>
      <div className="field-input" style={{ borderBottom: "2px solid var(--color-brand)" }}>
        {children}
      </div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
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
