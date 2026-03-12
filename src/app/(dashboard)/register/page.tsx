import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrar Empleado | Mikabel",
  description: "Dar de alta a un nuevo operador del punto de venta",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-baseline md:items-center justify-center p-4 font-sans">
      <RegisterForm />
    </div>
  );
}
