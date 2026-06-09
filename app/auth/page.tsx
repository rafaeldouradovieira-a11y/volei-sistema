import { Suspense } from "react";
import { AuthForm } from "./auth-form";

export default function AuthPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--color-cream)" }}
    >
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, oklch(0.17 0.055 150 / 0.06), transparent)",
        }}
      />

      <Suspense fallback={<div className="text-muted-foreground text-sm">Carregando...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
