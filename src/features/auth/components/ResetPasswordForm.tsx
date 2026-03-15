"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

// Mismo regex que usamos en Registro y Login
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordErrorMessage =
  "La contraseña debe tener al menos una mayúscula, una minúscula y un número";

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    async function verifyCode() {
      if (!oobCode) {
        setError("El código de recuperación es inválido o ha expirado.");
        setIsVerifying(false);
        return;
      }

      try {
        const emailAddress = await verifyPasswordResetCode(auth, oobCode);
        setEmail(emailAddress);
        setIsVerifying(false);
      } catch (err) {
        console.error("Error verificando código:", err);
        setError("El enlace ha expirado o ya fue utilizado.");
        setIsVerifying(false);
      }
    }
    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (!passwordRegex.test(newPassword)) {
      toast.error(passwordErrorMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
      toast.success("Contraseña restablecida correctamente.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Error al restablecer:", err);
      toast.error("No se pudo cambiar la contraseña. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-500 font-medium">Verificando enlace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl border-2 border-danger/10 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-danger" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Enlace no válido
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">¡Todo listo!</h3>
        <p className="text-gray-600 mb-6">
          Tu contraseña ha sido actualizada. Serás redirigido al login en unos
          segundos.
        </p>
        <Button onClick={() => router.push("/login")} variant="primary">
          Ir al Login ahora
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Nueva Contraseña
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Restableciendo acceso para{" "}
          <span className="font-bold text-gray-700">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Input
            label="Escribí tu nueva contraseña"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5 text-gray-400" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-[38px] text-gray-400 hover:text-primary transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <Input
          label="Repetí la contraseña"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5 text-gray-400" />}
        />

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed">
          <p className="font-bold mb-1">Requisitos de seguridad:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Mínimo 8 caracteres</li>
            <li>Al menos una mayúscula</li>
            <li>Al menos una minúscula</li>
            <li>Al menos un número</li>
          </ul>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          variant="primary"
          className="h-14"
        >
          Cambiar Contraseña
        </Button>
      </form>
    </div>
  );
}

export const ResetPasswordForm = () => {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};
