import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restablecer Contraseña | Mikabel",
  description: "Crea una nueva contraseña para tu cuenta de Mikabel POS",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-baseline md:items-center justify-center p-4 font-sans bg-gray-50/50">
      <ResetPasswordForm />
    </div>
  );
}
