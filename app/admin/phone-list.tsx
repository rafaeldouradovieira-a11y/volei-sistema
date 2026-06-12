"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/phone";
import { removePhone, toggleAdmin, authorizeFromAttempt } from "./actions";
import { AddPhoneForm } from "./add-phone-form";
import type { AuthorizedPhone, Profile, UnauthorizedAttempt } from "@/lib/supabase/types";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PhoneListProps {
  phones: AuthorizedPhone[];
  profileMap: Record<string, Pick<Profile, "id" | "name" | "avatar_url">>;
  recentAttempts: UnauthorizedAttempt[];
}

export function PhoneList({ phones, profileMap, recentAttempts }: PhoneListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showAttempts, setShowAttempts] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState<string | null>(null);

  async function handleRemove(id: string) {
    if (!confirm("Remover este número? O usuário perderá acesso.")) return;
    setLoadingId(id);
    const result = await removePhone(id);
    setLoadingId(null);
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  }

  async function handleAuthorize(phone: string) {
    setLoadingPhone(phone);
    const result = await authorizeFromAttempt(phone);
    setLoadingPhone(null);
    if (!result.ok) toast.error(result.error);
    else { toast.success("Número autorizado!"); router.refresh(); }
  }

  async function handleToggleAdmin(id: string, current: boolean) {
    setLoadingId(id);
    const result = await toggleAdmin(id, !current);
    setLoadingId(null);
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Unauthorized attempts — shown first so admin can act quickly */}
      {recentAttempts.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <button
            onClick={() => setShowAttempts(!showAttempts)}
            className="flex items-center gap-2 text-sm font-semibold w-full"
            style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--color-brand)", color: "white" }}
            >
              {recentAttempts.length}
            </span>
            Aguardando autorização
            <span className="ml-auto opacity-50 font-normal text-xs">
              {showAttempts ? "▲" : "▼"}
            </span>
          </button>

          {showAttempts && (
            <div className="space-y-2">
              {recentAttempts.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
                      {formatPhone(att.phone)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8e8e93" }}>
                      {format(new Date(att.attempted_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    disabled={loadingPhone === att.phone}
                    onClick={() => handleAuthorize(att.phone)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-85 active:scale-95 disabled:opacity-50"
                    style={{
                      background: "var(--color-brand)",
                      color: "white",
                      fontFamily: "var(--font-syne)",
                    }}
                  >
                    {loadingPhone === att.phone ? "..." : "Autorizar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
        >
          Números autorizados
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: "var(--color-brand)",
            color: "var(--color-lime)",
            fontFamily: "var(--font-syne)",
          }}
        >
          <span className="text-base leading-none">+</span>
          Adicionar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "white",
            border: "1px solid oklch(0.88 0.02 85)",
            boxShadow: "0 2px 12px rgba(12,43,26,0.07)",
          }}
        >
          <AddPhoneForm
            existingPhones={phones}
            onSuccess={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {/* Phone list */}
      <div className="space-y-2">
        {phones.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhum número cadastrado ainda.
          </div>
        )}
        {phones.map((ap) => {
          const profile = ap.auth_user_id ? profileMap[ap.auth_user_id] : null;
          const displayName = profile?.name ?? ap.display_name;
          const invitedBy = ap.invited_by_id
            ? phones.find((p) => p.id === ap.invited_by_id)
            : null;

          return (
            <div
              key={ap.id}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "white",
                border: "1px solid oklch(0.90 0.02 85)",
              }}
            >
              {/* Avatar / initials */}
              <div
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden text-sm font-bold"
                style={{
                  background: ap.is_admin
                    ? "var(--color-brand)"
                    : "oklch(0.91 0.03 127)",
                  color: ap.is_admin ? "var(--color-lime)" : "var(--color-brand)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : displayName ? (
                  displayName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                ) : (
                  "?"
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{
                      fontFamily: "var(--font-syne)",
                      color: "var(--color-brand)",
                    }}
                  >
                    {displayName ?? "Sem nome"}
                  </p>
                  {ap.is_admin && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: "var(--color-brand)",
                        color: "var(--color-lime)",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      Admin
                    </span>
                  )}
                  {!ap.auth_user_id && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "oklch(0.94 0.02 85)",
                        color: "oklch(0.55 0.04 85)",
                      }}
                    >
                      Não acessou
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatPhone(ap.phone)}
                  {invitedBy && (
                    <span className="ml-2 opacity-70">
                      · convidado por{" "}
                      {invitedBy.display_name ?? formatPhone(invitedBy.phone)}
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleAdmin(ap.id, ap.is_admin)}
                  disabled={loadingId === ap.id}
                  title={ap.is_admin ? "Remover admin" : "Tornar admin"}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:opacity-70"
                  style={{ color: ap.is_admin ? "var(--color-brand)" : "oklch(0.70 0.03 150)" }}
                >
                  {ap.is_admin ? "★" : "☆"}
                </button>
                <button
                  onClick={() => handleRemove(ap.id)}
                  disabled={loadingId === ap.id}
                  title="Remover acesso"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:opacity-70"
                  style={{ color: "oklch(0.55 0.12 25)" }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
