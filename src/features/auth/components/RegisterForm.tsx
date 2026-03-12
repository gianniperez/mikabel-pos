"use client";

import { useState } from "react";
// @ts-expect-error Typescript ESM resolution issue con RHF v7
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input";

const registerSchema = z
  .object({
    name: z.string().min(2, "Debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // 1. Crear el Auth User en Firebase
      const res = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      // 2. Crear su Profile Real en Firestore
      const userRef = doc(db, "users", res.user.uid);
      await setDoc(userRef, {
        id: res.user.uid,
        uid: res.user.uid,
        name: data.name,
        email: data.email,
        role: "employee", // Hardcoded por seguridad, solo el Dueño podrá elevar permisos
        createdAt: new Date(),
      });

      toast.success("¡Empleado registrado exitosamente!");
      router.push("/");
    } catch (error: unknown) {
      const fbError = error as { code: string };
      if (fbError.code === "auth/email-already-in-use") {
        toast.error("Este correo ya está registrado.");
      } else {
        toast.error("Error al registrar la cuenta.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border sm:border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Registro
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Dar de alta a un nuevo operador
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register("name")}
          label="Nombre Completo"
          type="text"
          placeholder="Juan Perez"
          icon={<User className="h-5 w-5" />}
          error={errors.name?.message}
        />

        <Input
          {...register("email")}
          label="Email"
          type="email"
          placeholder="operador@mikabel.com"
          icon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
        />

        <Input
          {...register("password")}
          label="Contraseña"
          type="password"
          placeholder="••••••"
          error={errors.password?.message}
        />

        <Input
          {...register("confirmPassword")}
          label="Confirmar Contraseña"
          type="password"
          placeholder="••••••"
          error={errors.confirmPassword?.message}
        />

        <Button
          className="mt-8"
          type="submit"
          disabled={isLoading}
          variant="primary"
        >
          {isLoading ? "Registrando..." : "Crear Cuenta"}
        </Button>
      </form>
    </div>
  );
};
