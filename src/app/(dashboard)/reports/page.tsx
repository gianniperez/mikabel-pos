"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/stores";
import { FinancialSummary } from "@/features/reports/components/FinancialSummary";
import { CashSessionsHistory } from "@/features/reports/components/CashSessionsHistory";
import { InventoryMetrics } from "@/features/reports/components/InventoryMetrics";
import { BarChart, Clock, PackageSearch, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type TabMenu = "financial" | "history" | "inventory";

export default function ReportsPage() {
  usePageMetadata({
    title: "Reportes",
    description: "Análisis de rendimiento, ventas y métricas financieras",
  });
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabMenu) || "financial";

  const { dbUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabMenu>(
    ["financial", "history", "inventory"].includes(initialTab)
      ? initialTab
      : "financial",
  );

  const [reportPeriod, setReportPeriod] = useState<
    "7d" | "30d" | "thisMonth" | "lastMonth"
  >("30d");

  // Seguridad de Ruta Client-Side
  if (dbUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6 text-center">
        <div className="p-4 bg-danger-light/30 text-danger rounded-2xl mb-4">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Acceso Restringido
        </h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          Esta área del sistema contiene información financiera sensible y es
          exclusiva para administradores.
        </p>
        <Link href="/pos">
          <Button variant="destructive" className="font-bold">
            Volver a la Caja
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50/50 p-4 md:p-6 pb-24">
      {/* Header y Navegación*/}
      <div className=" bg-gray-50/50 md:-mx-6 px-4 md:px-6 pt-2 pb-4 border-b border-gray-200">
        <PageHeader
          title="Inteligencia de Negocio"
          description="Reportes, Arqueos y Rendimiento del negocio."
        />

        {/* Navegación de Pestañas Responsiva */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
          <Button
            onClick={() => setActiveTab("financial")}
            className="flex items-center w-full gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest whitespace-nowrap transition-all"
            variant={activeTab === "financial" ? "primary" : "outline"}
          >
            <BarChart className="h-5 w-5" />
            Resumen General
          </Button>

          <Button
            onClick={() => setActiveTab("history")}
            className="flex items-center w-full gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest whitespace-nowrap transition-all"
            variant={activeTab === "history" ? "primary" : "outline"}
          >
            <Clock className="h-5 w-5" />
            Arqueos Pasados
          </Button>

          <Button
            onClick={() => setActiveTab("inventory")}
            className="flex items-center w-full gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest whitespace-nowrap transition-all"
            variant={activeTab === "inventory" ? "primary" : "outline"}
          >
            <PackageSearch className="h-5 w-5" />
            Métricas Catálogo
          </Button>
        </div>
      </div>

      {/* Selector de Periodo (Solo para Resumen General) */}
      {activeTab === "financial" && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-6 pb-2">
          {[
            { id: "7d", label: "Últimos 7 días" },
            { id: "30d", label: "Últimos 30 días" },
            { id: "thisMonth", label: "Este Mes" },
            { id: "lastMonth", label: "Mes Pasado" },
          ].map((period) => (
            <Button
              key={period.id}
              onClick={() =>
                setReportPeriod(
                  period.id as "7d" | "30d" | "thisMonth" | "lastMonth",
                )
              }
              variant={reportPeriod === period.id ? "secondary" : "outline"}
              rounded="full"
              className="text-[10px] sm:text-sm py-2 px-1 sm:px-4 w-full sm:w-auto gap-1 sm:gap-2 transition-all"
            >
              {period.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex-1 animate-in fade-in zoom-in-95 duration-200 mt-4">
        {activeTab === "financial" && (
          <FinancialSummary period={reportPeriod} />
        )}
        {activeTab === "history" && <CashSessionsHistory />}
        {activeTab === "inventory" && <InventoryMetrics />}
      </div>
    </div>
  );
}
