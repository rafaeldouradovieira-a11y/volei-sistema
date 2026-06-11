"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { phoneLogin } from "./actions";
import { formatPhone, normalizePhone } from "@/lib/phone";

type Step = "phone" | "profile";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(digits);
    setUnauthorized(false);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setUnauthorized(false);

    try {
      const result = await phoneLogin(phone);

      if (!result.ok) {
        if (result.error === "unauthorized") {
          setUnauthorized(true);
          return;
        }
        if (result.error === "invalid_phone") {
          toast.error("Telefone inválido. Digite DDD + número.");
          return;
        }
        toast.error(result.error);
        return;
      }

      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: result.tokenHash,
        type: "magiclink",
      });

      if (verifyError) {
        toast.error("Erro ao autenticar. Tente novamente.");
        return;
      }

      // Check if profile already exists
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sessão expirada. Tente novamente.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.name) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setStep("profile");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");

      let avatar_url: string | null = null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          avatar_url = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: name.trim(),
        avatar_url,
      });

      if (error) throw error;

      toast.success("Bem-vindo ao VÔLEI.SYSTEM!");
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  const displayPhone = phone.length >= 10
    ? formatPhone(normalizePhone(phone))
    : phone.length > 0
    ? `(${phone.slice(0, 2)}) ${phone.slice(2)}`
    : "";

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
          VÔLEI<span style={{ color: "rgba(239,68,68,0.5)" }}>.SYSTEM</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "profile"
            ? "Primeiro acesso — complete seu perfil"
            : "Entre com seu número de WhatsApp"}
        </p>
      </div>

      {step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <FormField label="WhatsApp">
            <input
              type="tel"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              value={displayPhone}
              onChange={handlePhoneChange}
              required
              autoFocus
            />
          </FormField>

          {unauthorized && (
            <div
              className="rounded-xl p-4 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
              }}
            >
              <p className="font-semibold mb-0.5">Usuário não encontrado.</p>
              <p className="opacity-80">Um admin foi avisado sobre sua tentativa.</p>
            </div>
          )}

          <SubmitButton loading={loading} label="Entrar" />
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
              style={{
                background: avatarPreview ? "transparent" : "#232323",
                border: "3px dashed",
                borderColor: avatarPreview ? "var(--color-brand)" : "#3a3a3c",
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">📸</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-muted-foreground">
              {avatarPreview ? "Toque para trocar" : "Adicionar foto (opcional)"}
            </p>
          </div>

          <FormField label="Seu nome">
            <input
              type="text"
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <SubmitButton loading={loading} label="Entrar no sistema" />
        </form>
      )}
    </div>
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
        style={{
          fontFamily: "var(--font-syne)",
          color: "var(--color-brand)",
        }}
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

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
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
