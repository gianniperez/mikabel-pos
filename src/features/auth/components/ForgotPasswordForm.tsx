"use client";

import { useState } from "react";
import {
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input";
import { Mail } from "lucide-react";

export const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [errorObj, setErrorObj] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorObj("Email inválido");
      return;
    }
    setErrorObj(null);
    setIsLoading(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        toast.error("El mail ingresado no está registrado.");
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
      toast.success("Correo enviado exitosamente");
    } catch (error: unknown) {
      const fbError = error as { code: string };
      if (fbError.code === "auth/user-not-found") {
        toast.error("No existe un usuario con este correo electrónico.");
      } else {
        toast.error("Ocurrió un error al intentar enviar el correo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border sm:border-gray-100 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          Revisa tu correo
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Hemos enviado un enlace de recuperación de contraseña a tu dirección
          de correo electrónico. Por favor, revisa tu bandeja de entrada o la
          carpeta de spam.
        </p>
        <Link
          href="/login"
          className="block w-full py-3.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-mikabel font-bold hover:bg-gray-100 transition-colors"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border sm:border-gray-100">
      <div className="text-center mb-8">
        <div className="flex justify-center">
          <h1 className="text-3xl font-extrabold text-main tracking-tight">
            Mikabel
          </h1>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            POS
          </h1>
        </div>
        <p className="text-gray-500 mt-2 text-sm font-medium">
          Recuperar Contraseña
        </p>
      </div>

      <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
        Ingresá tu correo electrónico y te enviaremos un enlace para que puedas
        cambiar tu contraseña.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email registrado"
          type="email"
          placeholder="operador@mikabel.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-5 w-5" />}
          error={errorObj || undefined}
        />

        <Button type="submit" disabled={isLoading} variant="primary">
          {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>
      </form>

      <div className="text-center pt-6">
        <Link
          href="/login"
          className="text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors"
        >
          ← Volver al login
        </Link>
      </div>
    </div>
  );
};
