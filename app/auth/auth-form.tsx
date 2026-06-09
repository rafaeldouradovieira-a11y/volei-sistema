"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    const supabase = createClient();
    setLoading(true);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, faça login novamente");

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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">🏐</div>
        <CardTitle className="text-2xl">Vôlei System</CardTitle>
        <CardDescription>
          {step === "email" && "Entre com seu e-mail para acessar"}
          {step === "otp" && `Código enviado para ${email}`}
          {step === "profile" && "Complete seu cadastro"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Continuar"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Código de verificação</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                autoFocus
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Verificar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("email")}
            >
              Usar outro e-mail
            </Button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Concluir cadastro"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
