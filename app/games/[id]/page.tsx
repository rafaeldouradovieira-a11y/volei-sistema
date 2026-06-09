import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, MapPin, Clock, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GameActions } from "@/components/game/game-actions";
import type { GameWithDetails } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("games")
    .select(
      `
      *,
      profiles(*),
      game_participants(*, profiles(*)),
      waiting_list(*, profiles(*))
    `
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const game = data as GameWithDetails;
  const participantCount = game.game_participants.length;
  const confirmedCount = game.game_participants.filter(
    (p) => p.payment_status === "confirmed"
  ).length;
  const pricePerPerson =
    game.price_total && participantCount > 0
      ? (game.price_total / participantCount).toFixed(2)
      : null;

  const dateFormatted = format(parseISO(game.date), "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  const statusLabel = {
    active: "Ativo",
    closed: "Encerrado",
    cancelled: "Cancelado",
  }[game.status];

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    closed: "secondary",
    cancelled: "destructive",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="font-semibold truncate">
            {game.title || `Vôlei em ${game.location}`}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Info card */}
        <div className="bg-white rounded-lg border p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {game.title || `Vôlei em ${game.location}`}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Organizado por {game.profiles.name}
              </p>
            </div>
            <Badge variant={statusVariant[game.status]}>{statusLabel}</Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              <span className="capitalize">{dateFormatted}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={15} className="text-gray-400 shrink-0" />
              <span>
                {game.time.slice(0, 5)} · {game.duration_hours}h
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 col-span-2">
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <span>
                {game.location}
                {game.court ? ` · ${game.court}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={15} className="text-gray-400 shrink-0" />
              <span>
                {participantCount}/{game.max_players} pessoas
              </span>
            </div>
            {pricePerPerson && (
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <span className="text-gray-400 text-base">R$</span>
                <span>{pricePerPerson}/pessoa</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border p-4">
          <GameActions game={game} currentUserId={user?.id ?? null} />
        </div>

        {/* Participant list */}
        <div className="bg-white rounded-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Lista ({participantCount}/{game.max_players})
            </h3>
            {game.price_total && participantCount > 0 && (
              <span className="text-sm text-gray-500">
                {confirmedCount}/{participantCount} pagos
              </span>
            )}
          </div>

          {participantCount === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Nenhum participante ainda
            </p>
          ) : (
            <div className="space-y-2">
              {game.game_participants.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">
                      {i + 1}.
                    </span>
                    <div>
                      <span className="font-medium text-sm">{p.profiles.name}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {p.profiles.phone}
                      </span>
                    </div>
                  </div>
                  {game.price_total && (
                    <Badge
                      variant={
                        p.payment_status === "confirmed" ? "default" : "outline"
                      }
                      className={
                        p.payment_status === "confirmed"
                          ? "bg-green-500 hover:bg-green-600"
                          : "text-yellow-600 border-yellow-300"
                      }
                    >
                      {p.payment_status === "confirmed" ? "Pago" : "Pendente"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Waiting list */}
          {game.waiting_list.length > 0 && (
            <>
              <Separator className="my-4" />
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                Lista de espera ({game.waiting_list.length})
              </h4>
              <div className="space-y-2">
                {game.waiting_list.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3 py-1">
                    <span className="text-xs text-gray-400 w-5 text-right">
                      {i + 1}.
                    </span>
                    <div>
                      <span className="text-sm text-gray-600">
                        {w.profiles.name}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">
                        {w.profiles.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
