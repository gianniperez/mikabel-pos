"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    async function verify() {
      if (!oobCode) {
        setError("El código de verificación es inválido o ha expirado.");
        setIsVerifying(false);
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        setIsSuccess(true);
        setIsVerifying(false);
        toast.success("¡Email verificado correctamente!");
      } catch (err) {
        console.error("Error verificando email:", err);
        setError("El enlace ha expirado o ya fue utilizado.");
        setIsVerifying(false);
      }
    }
    verify();
  }, [oobCode]);

  if (isVerifying) {
    return (
      <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-xl max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Verificando tu cuenta
        </h3>
        <p className="text-gray-500 font-medium">
          Esto tomará solo un momento...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl border-2 border-danger/10 shadow-xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-danger" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Error de verificación
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => router.push("/login")} variant="outline">
          Volver al Login
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-2xl border-2 border-success/10 shadow-xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          ¡Cuenta verificada!
        </h3>
        <p className="text-gray-600 mb-6">
          Gracias por confirmar tu correo. Ahora podés iniciar sesión y comenzar
          a usar Mikabel POS.
        </p>
        <Button onClick={() => router.push("/login")} variant="primary">
          Ir al Login
        </Button>
      </div>
    );
  }

  return null;
}

export const VerifyEmailForm = () => {
  return (
    <Suspense
      fallback={
        <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-xl max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
};
