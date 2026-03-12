import { ForgotPasswordForm } from "@/features/auth/components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Contraseña | Mikabel",
  description: "Restablece el acceso a tu cuenta del Punto de Venta",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <ForgotPasswordForm />
    </div>
  );
}
