"use client";

import { useState } from "react";
// @ts-ignore
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, secondaryAuth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordErrorMessage =
  "La contraseña debe tener al menos una mayúscula, una minúscula y un número";

const registerSchema = z
  .object({
    name: z.string().min(2, "Debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres").regex(passwordRegex, {
      message: passwordErrorMessage,
    }),
    confirmPassword: z.string(),
    role: z.enum(["admin", "employee"]),
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
    // @ts-ignore
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "employee",
    },
  });

  const onSubmit: SubmitHandler<any> = async (data: any) => {
    setIsLoading(true);
    try {
      // 1. Crear el Auth User en Firebase usando la instancia secundaria
      // Esto evita que el administrador actual sea deslogueado.
      const res = await createUserWithEmailAndPassword(
        secondaryAuth,
        data.email,
        data.password,
      );

      // 2. Enviar email de bienvenida/verificación
      await sendEmailVerification(res.user);

      // 3. Crear su Profile Real en Firestore
      const userRef = doc(db, "users", res.user.uid);
      await setDoc(userRef, {
        id: res.user.uid,
        uid: res.user.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        permissions:
          data.role === "admin"
            ? {
                edit_stock: true,
                edit_prices: true,
                edit_product: true,
                delete_customer: true,
                view_reports: true,
              }
            : {
                edit_stock: false,
                edit_prices: false,
                edit_product: false,
                delete_customer: false,
                view_reports: false,
              },
        createdAt: new Date(),
      });

      toast.success("¡Empleado registrado exitosamente!");

      // Muy importante: Cerramos la sesión en la instancia secundaria
      // para que no quede "pegado" el nuevo usuario y permita el siguiente registro.
      await signOut(secondaryAuth);

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
          label="Nombre"
          type="text"
          placeholder="Juan Perez"
          icon={<User className="h-5 w-5" />}
          error={errors.name?.message}
        />

        <Input
          {...register("role")}
          label="Rol del Usuario"
          type="select"
          error={errors.role?.message}
          options={[
            { label: "Operadora", value: "employee" },
            { label: "Admin", value: "admin" },
          ]}
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
          isLoading={isLoading}
          variant="primary"
        >
          Crear Cuenta
        </Button>
      </form>
    </div>
  );
};
