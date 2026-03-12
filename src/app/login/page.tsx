import { LoginForm } from "@/features/auth/components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Mikabel",
  description: "Ingreso al centro de control del Punto de Venta",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <LoginForm />
    </div>
  );
}
