"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { saveChampionshipProof, confirmMyChampionshipPayment } from "@/app/campeonato/[id]/actions";

interface Props {
  championshipId: string;
  pricePerPerson: number | null;
  pixKey: string | null;
  proofUrl: string | null;
}

export function CheckinPaymentButton({ championshipId, pricePerPerson, pixKey, proofUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleUploadProof() {
    if (!proofFile) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = proofFile.name.split(".").pop() ?? "jpg";
      const path = `championship-${championshipId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("proofs")
        .upload(path, proofFile, { upsert: true });
      if (upErr) { toast.error("Erro ao enviar comprovante"); return; }
      const { data: { publicUrl } } = supabase.storage.from("proofs").getPublicUrl(path);
      const res = await saveChampionshipProof(championshipId, publicUrl);
      if (res.error) toast.error(res.error);
      else { toast.success("Comprovante enviado!"); router.refresh(); }
      setProofFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    const res = await confirmMyChampionshipPayment(championshipId);
    setConfirming(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.success);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95"
        style={{ background: "rgba(251,191,36,0.15)", color: "#92400e", fontFamily: "var(--font-syne)" }}
      >
        Confirmar inscrição
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar inscrição</DialogTitle>
            <DialogDescription>Faça o PIX e anexe o comprovante</DialogDescription>
          </DialogHeader>

          {pricePerPerson && (
            <div className="text-center py-4">
              <div
                className="text-5xl font-extrabold"
                style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
              >
                R$ {pricePerPerson}
              </div>
              <div className="text-sm text-muted-foreground mt-1">valor por pessoa</div>
            </div>
          )}

          {pixKey && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
              >
                Chave PIX
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm break-all" style={{ color: "var(--color-brand)" }}>
                  {pixKey}
                </code>
                <button
                  className="p-2 rounded-lg transition-colors hover:bg-muted"
                  onClick={() => {
                    navigator.clipboard.writeText(pixKey);
                    toast.success("Chave copiada!");
                  }}
                  style={{ color: "var(--color-brand)" }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              className="block text-xs font-semibold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-syne)", color: "var(--color-brand)" }}
            >
              Comprovante
            </label>
            <div className="flex gap-2">
              <label
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors hover:opacity-80"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--color-brand)",
                  border: proofFile ? "1.5px solid var(--color-brand)" : "1.5px dashed #ccc",
                  fontFamily: "var(--font-syne)",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                {proofFile ? proofFile.name.slice(0, 20) : "Anexar imagem"}
              </label>
              {proofFile && (
                <button
                  disabled={uploading}
                  onClick={handleUploadProof}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50"
                  style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
                >
                  {uploading ? "..." : "Enviar"}
                </button>
              )}
            </div>
            {proofUrl && !proofFile && (
              <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs underline text-muted-foreground">
                Comprovante já enviado — ver
              </a>
            )}
          </div>

          <button
            disabled={confirming}
            onClick={handleConfirm}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--color-brand)", color: "var(--color-lime)", fontFamily: "var(--font-syne)" }}
          >
            <CheckCircle size={15} />
            {confirming ? "Confirmando..." : "Confirmar que paguei"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
