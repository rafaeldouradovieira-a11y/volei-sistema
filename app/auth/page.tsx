import { Suspense } from "react";
import { AuthForm } from "./auth-form";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
