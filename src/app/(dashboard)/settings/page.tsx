"use client";

import { useSettingsStore } from "@/features/admin/stores/useSettingsStore";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import {
  Save,
  Lock,
  Percent,
  PackageOpen,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/stores";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { importProductsFromJson } from "@/features/inventory/services/importService";
import { useRef, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { db as dbFirestore } from "@/lib/firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/dexie";

export default function SettingsPage() {
  const { dbUser } = useAuthStore();
  const {
    transferSurcharge,
    cardSurcharge,
    defaultMinStock,
    adminPin,
    setTransferSurcharge,
    setCardSurcharge,
    setDefaultMinStock,
    setAdminPin,
  } = useSettingsStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    processed: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (dbUser && dbUser.role !== "admin") {
    redirect("/");
  }

  const handleSave = () => {
    toast.success("Configuraciones guardadas localmente.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        setIsImporting(true);
        setImportStats(null);
        const result = await importProductsFromJson(
          content,
          (processed, total) => {
            setImportStats({ processed, total });
          },
        );
        toast.success(`Se importaron ${result.count} productos correctamente.`);
      } catch (error) {
        console.error("Error al importar:", error);
        toast.error(
          "Error al procesar el archivo. Asegúrate que sea un JSON válido.",
        );
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleClearInventory = async () => {
    setIsClearing(true);
    try {
      // Borrar todos los docs de Firestore en batches de 500
      const snapshot = await getDocs(collection(dbFirestore, "products"));
      const CHUNK_SIZE = 500;
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(dbFirestore);
        docs.slice(i, i + CHUNK_SIZE).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      // Borrar Dexie local también
      await db.products.clear();
      toast.success(
        `Inventario limpiado. ${docs.length} productos eliminados.`,
      );
    } catch (error) {
      console.error("Error limpiando inventario:", error);
      toast.error("Error al limpiar el inventario.");
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Configuración General"
        description="Gestiona las reglas y seguridad de MikabelPOS."
        actionButton={
          <Button onClick={handleSave} className="w-full md:w-auto">
            <Save className="w-5 h-5" />
            Guardar Cambios
          </Button>
        }
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
            <Input
              label="Recargo por Tarjeta (%)"
              type="number"
              value={cardSurcharge * 100}
              onChange={(e) => setCardSurcharge(Number(e.target.value) / 100)}
              helperText="Este porcentaje se sumará automáticamente a las ventas con método 'Tarjeta'."
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

        {/* Card: Carga Masiva */}
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-primary-light shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Carga Masiva (Plantilla)
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Selecciona el archivo <strong>seed-template.json</strong> para
              cargar el catálogo completo de productos.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <Button
              variant="outline"
              className="w-full h-12 gap-2 border-primary text-primary hover:bg-primary-light/10"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PackageOpen className="w-5 h-5" />
              )}
              {isImporting ? "Importando..." : "Subir seed-template.json"}
            </Button>

            {isImporting && importStats && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-primary italic">
                  <span>Procesando productos...</span>
                  <span>
                    {importStats.processed} / {importStats.total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{
                      width: `${(importStats.processed / importStats.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              <strong>Nota:</strong> Los productos se sumarán al catálogo
              actual. Si ya existen, se crearán duplicados unless utilices el
              mismo ID interno. (Próxima mejora: detección de duplicados por
              código).
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
              <p className="text-sm font-semibold text-danger">
                Zona de peligro
              </p>
              <Button
                variant="destructive"
                className="w-full h-12 gap-2"
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                {isClearing ? "Eliminando..." : "Limpiar todo el inventario"}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Elimina todos los productos. No se puede deshacer.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearInventory}
        title="¿Limpiar todo el inventario?"
        description="Esta acción eliminará TODOS los productos permanentemente de Firestore y del dispositivo. No se puede deshacer."
        confirmText="Sí, eliminar todo"
      />
    </div>
  );
}
