"use client";

import { useSettingsStore } from "@/features/admin/stores/useSettingsStore";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { Save, Lock, Percent, PackageOpen } from "lucide-react";
import { useAuthStore } from "@/features/auth/stores";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

export default function SettingsPage() {
  const { dbUser } = useAuthStore();
  const {
    transferSurcharge,
    defaultMinStock,
    adminPin,
    setTransferSurcharge,
    setDefaultMinStock,
    setAdminPin,
  } = useSettingsStore();

  if (dbUser && dbUser.role !== "admin") {
    redirect("/");
  }

  const handleSave = () => {
    toast.success("Configuraciones guardadas localmente.");
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Configuración del Negocio"
        description="Gestiona las reglas y seguridad de MikabelPOS."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Finanzas */}
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-light/30 rounded-lg">
              <Percent className="w-5 h-5 text-success" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Finanzas y Recargos
            </h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Recargo por Transferencia (%)"
              type="number"
              value={transferSurcharge * 100}
              onChange={(e) =>
                setTransferSurcharge(Number(e.target.value) / 100)
              }
              helperText="Este porcentaje se sumará automáticamente a las ventas con método 'Transferencia'."
            />
          </div>
        </div>

        {/* Card: Inventario */}
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light/30 rounded-lg">
              <PackageOpen className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Stock Mínimo por Defecto"
              type="number"
              value={defaultMinStock}
              onChange={(e) => setDefaultMinStock(Number(e.target.value))}
              helperText="Los productos sin stock mínimo específico usarán este valor para las alertas."
            />
          </div>
        </div>

        {/* Card: Seguridad (PIN) */}
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terciary-light/30 rounded-lg">
              <Lock className="w-5 h-5 text-terciary" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Seguridad (PIN Admin)
            </h2>
          </div>

          <div className="space-y-4">
            <Input
              label="PIN de Autorización (4 dígitos)"
              type="password"
              maxLength={4}
              value={adminPin}
              onChange={(e) =>
                setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              helperText="Se requerirá este PIN para acciones críticas como anular ventas."
            />
            <div className="p-3 bg-blue-50 rounded-xl border border-primary-light/30 text-sm text-primary">
              Sugerencia: Cambia el PIN periódicamente para mantener la
              seguridad.
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          className="w-full md:w-auto px-8 py-4 text-lg font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
        >
          <Save className="w-5 h-5 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
