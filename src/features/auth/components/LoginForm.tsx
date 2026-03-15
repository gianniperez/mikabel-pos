"use client";

import { useState } from "react";
// @ts-ignore
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  linkWithCredential,
  AuthCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Mail } from "lucide-react";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordErrorMessage =
  "La contraseña debe tener al menos una mayúscula, una minúscula y un número";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] =
    useState<AuthCredential | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkPasswordError, setLinkPasswordError] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    // @ts-ignore
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email:
        typeof window !== "undefined"
          ? localStorage.getItem("mikabel_remember_email") || ""
          : "",
      rememberMe:
        typeof window !== "undefined"
          ? !!localStorage.getItem("mikabel_remember_email")
          : false,
    },
  });

  const handleAuthSuccess = async () => {
    toast.success(`Bienvenido/a`);
  };

  const onSubmit: SubmitHandler<any> = async (data: any) => {
    setIsLoading(true);
    try {
      // Configurar persistencia según el checkbox
      const persistence = data.rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;

      await setPersistence(auth, persistence);

      const res = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      // Guardar email si "Recordarme" está activo
      if (data.rememberMe) {
        localStorage.setItem("mikabel_remember_email", data.email);
      } else {
        localStorage.removeItem("mikabel_remember_email");
      }

      await handleAuthSuccess();
    } catch (error: unknown) {
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
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone;

      let result;
      if (isStandalone) {
        await signInWithRedirect(auth, provider);
        return; // El flujo continúa después del redirect
      } else {
        result = await signInWithPopup(auth, provider);
        toast.success(`Bienvenido/a`);
      }
    } catch (error: any) {
      console.error("Error en Google Login:", error);

      if (error.code === "auth/account-exists-with-different-credential") {
        // Guardamos la credencial de Google para usarla luego en el link
        const credential = GoogleAuthProvider.credentialFromError(error);
        if (credential) {
          setPendingGoogleCredential(credential);
          setShowLinkPrompt(true);
          toast.info(
            "Tu correo ya está registrado con contraseña. Ingresala para activar Google.",
            { duration: 6000 },
          );
        }
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error(
          "Error: Dominio no autorizado. Verifica la consola de Firebase.",
        );
      } else if (error.code === "auth/operation-not-allowed") {
        toast.error("Error: El inicio de sesión con Google no está habilitado en Firebase.");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("El navegador bloqueó la ventana de inicio de sesión. Permití los popups e intentá de nuevo.");
      } else {
        toast.error(`Error al iniciar con Google: ${error.code || "Error desconocido"}`);
        console.error("Detalle del error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleCredential || !linkPassword) return;
    setLinkPasswordError(null);

    // Validar contraseña antes de intentar vincular
    if (!passwordRegex.test(linkPassword)) {
      setLinkPasswordError(passwordErrorMessage);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Iniciar sesión con email/password (las credenciales que ya existen)
      const userEmail = (pendingGoogleCredential as any)._tokenResponse?.email;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userEmail,
        linkPassword,
      );

      // 2. Vincular la credencial de Google a este usuario
      await linkWithCredential(
        userCredential.user,
        pendingGoogleCredential,
      ).catch((err) => {
        // Si ya está vinculado, linkWithCredential podría fallar.
        // Pero en este punto, si llegamos aquí es porque Firebase reportó conflicto inicial.
        console.warn("Error vinculando (posiblemente ya estaba):", err);
      });

      toast.success("¡Cuentas vinculadas! Ahora puedes usar Google.");
      setShowLinkPrompt(false);
      setPendingGoogleCredential(null);
      setLinkPassword("");
    } catch (error: any) {
      console.error("Error al vincular cuentas:", error);
      toast.error("Contraseña incorrecta. No se pudo vincular con Google.");
    } finally {
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

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
            />
            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
              Recordarme
            </span>
          </label>
        </div>

        <Button type="submit" isLoading={isLoading} variant="primary">
          Iniciar Sesión
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
        isLoading={isLoading}
        disabled={showLinkPrompt}
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

      {/* Modal/Overlay para Vincular Cuenta */}
      {showLinkPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Activar Acceso con Google
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Para vincular tu cuenta, por favor ingresa tu contraseña de
              Mikabel una última vez.
            </p>

            <form onSubmit={handleLinkAccount} className="space-y-4">
              <Input
                label="Tu Contraseña"
                type="password"
                placeholder="••••••"
                value={linkPassword}
                onChange={(e) => {
                  setLinkPassword(e.target.value);
                  if (linkPasswordError) setLinkPasswordError(null);
                }}
                error={linkPasswordError || undefined}
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowLinkPrompt(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Vincular y Entrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center border-t border-gray-100 pt-6">
        <span className="text-gray-500 text-sm">¿Aún no tenés cuenta? </span>
        <span className="text-gray-700 font-bold text-sm">
          Consultá con el equipo
        </span>
      </div>
    </div>
  );
};
