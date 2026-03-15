import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar Cuenta | Mikabel",
  description: "Confirma tu dirección de correo electrónico para Mikabel POS",
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-baseline md:items-center justify-center p-4 font-sans bg-gray-50/50">
      <VerifyEmailForm />
    </div>
  );
}
