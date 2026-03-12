"use client";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/features/auth/stores";
import { DashboardSummary } from "@/features/dashboard/components/DashboardSummary";
import { usePageMetadata } from "@/hooks/usePageMetadata";

export default function DashboardHomePage() {
  usePageMetadata({
    title: "Inicio",
    description: "Centro de control operativo y resumen de métricas de Mikabel",
  });

  const { dbUser: user } = useAuthStore();

  return (
    <main className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title={`¡Hola ${user?.name.split(" ")[0]}! 👋`}
        description="Este es el resumen operativo de hoy."
      />

      <DashboardSummary />
    </main>
  );
}
