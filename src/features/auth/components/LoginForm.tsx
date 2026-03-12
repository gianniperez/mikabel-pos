"use client";

import { useState } from "react";
// @ts-expect-error Typescript ESM resolution issue con RHF v7
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleAuthSuccess = async (user: any) => {
    toast.success(`Bienvenido/a`);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const res = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      await handleAuthSuccess(res.user);
    } catch (error: any) {
      toast.error(
        "Error al iniciar sesión: Credenciales incorrectas o el usuario no existe",
      );
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success(`Bienvenido/a`);
    } catch (error: any) {
      console.error(error);
      toast.error("Error al iniciar con Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border sm:border-gray-100">
      <div className="text-center flex flex-col mb-8">
        <div className="flex justify-center">
          <h1 className="text-3xl font-extrabold text-main tracking-tight">
            Mikabel
          </h1>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            POS
          </h1>
        </div>
        <p className="text-gray-500 mt-2 text-sm">
          Ingreso para Empleados y Administradores
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="operador@gmail.com"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••"
          error={errors.password?.message}
          labelRightContent={
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-primary hover:text-primary-dark"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
          {...register("password")}
        />
        <Button type="submit" disabled={isLoading} variant="primary">
          {isLoading ? "Conectando..." : "Iniciar Sesión"}
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-center space-x-3">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          O entrar rápido con
        </span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <Button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        variant="ghost"
        className="w-full shadow-md mt-4 hover:shadow-xl"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>

      <div className="mt-8 text-center border-t border-gray-100 pt-6">
        <span className="text-gray-500 text-sm">¿Aún no tenés cuenta? </span>
        <span className="text-gray-700 font-bold text-sm">
          Consultá con el equipo
        </span>
      </div>
    </div>
  );
};
