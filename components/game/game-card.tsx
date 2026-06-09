import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GameWithDetails } from "@/lib/supabase/types";

interface GameCardProps {
  game: GameWithDetails;
}

export function GameCard({ game }: GameCardProps) {
  const participantCount = game.game_participants.length;
  const isFull = participantCount >= game.max_players;
  const dateStr = format(parseISO(game.date), "EEE, dd/MM", { locale: ptBR });
  const pricePerPerson =
    game.price_total && participantCount > 0
      ? (game.price_total / participantCount).toFixed(2)
      : null;

  return (
    <Link href={`/games/${game.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {game.status === "active" ? (
                  isFull ? (
                    <Badge variant="secondary">Lotado</Badge>
                  ) : (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Aberto
                    </Badge>
                  )
                ) : game.status === "cancelled" ? (
                  <Badge variant="destructive">Cancelado</Badge>
                ) : (
                  <Badge variant="outline">Encerrado</Badge>
                )}
                {game.waiting_list.length > 0 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    +{game.waiting_list.length} na espera
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-base truncate">
                {game.title || `Vôlei em ${game.location}`}
              </h3>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar size={13} />
                  <span className="capitalize">{dateStr}</span>
                  <span>·</span>
                  <Clock size={13} />
                  <span>{game.time.slice(0, 5)}</span>
                  <span>·</span>
                  <span>{game.duration_hours}h</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin size={13} />
                  <span className="truncate">{game.location}</span>
                  {game.court && (
                    <>
                      <span>·</span>
                      <span>{game.court}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users size={13} />
                  <span>
                    {participantCount}/{game.max_players} pessoas
                  </span>
                  {pricePerPerson && (
                    <>
                      <span>·</span>
                      <span className="text-green-700 font-medium">
                        R$ {pricePerPerson}/pessoa
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-gray-400">org.</div>
              <div className="text-sm font-medium">
                {game.profiles.name.split(" ")[0]}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
