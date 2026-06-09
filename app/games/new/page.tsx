"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    court: "",
    duration_hours: "2",
    max_players: "12",
    price_total: "",
    pix_key: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/games/new");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      if (!profile) {
        router.push("/auth?redirect=/games/new");
        return;
      }

      const { data, error } = await supabase
        .from("games")
        .insert({
          organizer_id: user.id,
          title: form.title || null,
          date: form.date,
          time: form.time,
          location: form.location,
          court: form.court || null,
          duration_hours: parseFloat(form.duration_hours),
          max_players: parseInt(form.max_players),
          price_total: form.price_total ? parseFloat(form.price_total) : null,
          pix_key: form.pix_key || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Vôlei criado!");
      router.push(`/games/${data.id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar vôlei"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Criar vôlei</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do jogo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Vôlei da galera"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Ex: Arena Beach Club"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="court">Quadra (opcional)</Label>
                <Input
                  id="court"
                  name="court"
                  placeholder="Ex: Quadra 3"
                  value={form.court}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">Duração (h) *</Label>
                  <Input
                    id="duration_hours"
                    name="duration_hours"
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={form.duration_hours}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_players">Limite *</Label>
                  <Input
                    id="max_players"
                    name="max_players"
                    type="number"
                    min="2"
                    max="100"
                    value={form.max_players}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_total">Valor total (R$)</Label>
                  <Input
                    id="price_total"
                    name="price_total"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.price_total}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  name="pix_key"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={form.pix_key}
                  onChange={handleChange}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar vôlei"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
