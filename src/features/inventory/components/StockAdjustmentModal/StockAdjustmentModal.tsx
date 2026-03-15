import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/features/auth/stores";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { logStockMovement } from "../../api/stockMovements";
import { AuthPinModal } from "@/components/ui/AuthPinModal";
import { toast } from "sonner";
import { AlertTriangle, Save } from "lucide-react";
import { StockMovementType } from "@/types/models";
import { cn } from "@/lib/utils";
import type { StockAdjustmentModalProps } from "./StockAdjustmentModal.types";

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  initialDelta,
}: StockAdjustmentModalProps) {
  const { dbUser } = useAuthStore();
  const { activeSession } = useCashSessionStore();
  const isAdmin = dbUser?.role === "admin";

  const [absQuantity, setAbsQuantity] = useState(Math.abs(initialDelta));
  const [reason, setReason] = useState<StockMovementType>("correction");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "substract">(
    initialDelta < 0 ? "substract" : "add",
  );

  // El delta real depende del modo
  const delta = mode === "substract" ? -absQuantity : absQuantity;

  useEffect(() => {
    if (isOpen) {
      setAbsQuantity(Math.abs(initialDelta));
      setMode(initialDelta < 0 ? "substract" : "add");
      setReason(initialDelta < 0 ? "loss" : "restock");
      setDescription("");
    }
  }, [isOpen, initialDelta]);

  if (!product) return null;

  const handleSaveClick = () => {
    if (isAdmin) {
      handleConfirmAdjustment();
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleConfirmAdjustment = async () => {
    setIsProcessing(true);
    try {
      await logStockMovement({
        productId: product.id,
        quantity: delta,
        reason,
        description: description || undefined,
        employeeId: dbUser?.uid || "unknown",
        sessionId: activeSession?.id,
      });

      toast.success("Movimiento registrado correctamente");
      onClose();
    } catch (error) {
      console.error("Error logging stock movement:", error);
      toast.error("Error al registrar el movimiento de stock");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => !isProcessing && onClose()}
        title="Ajuste de Stock"
        description={`Producto: ${product.name} ${product.brand || ""}`}
      >
        <div className="space-y-6">
          {/* Ajuste de Cantidad */}
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4 text-center">
              {mode === "substract"
                ? "Cantidad a Descontar"
                : "Cantidad a Sumar"}
            </span>
            <div className="flex items-center justify-center gap-4">
              <div className="relative group">
                <span
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl",
                    mode === "substract" ? "text-danger" : "text-success",
                  )}
                >
                  {mode === "substract" ? "-" : "+"}
                </span>
                <input
                  type="number"
                  step={product.quantityUnit === "kg" ? 0.1 : 1}
                  min={0.1}
                  className={cn(
                    "w-40 bg-white border-2 border-gray-200 rounded-xl py-4 pl-10 pr-4 text-center text-3xl font-black outline-none transition-colors",
                    mode === "substract"
                      ? "text-danger focus:border-danger"
                      : "text-success focus:border-success",
                  )}
                  value={absQuantity}
                  onChange={(e) =>
                    setAbsQuantity(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                />
              </div>
              <span className="text-gray-400 font-bold uppercase text-sm">
                {product.quantityUnit === "unit"
                  ? "unidades"
                  : product.quantityUnit}
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-4 text-center">
              Stock actual: <span className="font-bold">{product.stock}</span> →
              Nuevo:{" "}
              <span className="font-bold text-primary">
                {Math.max(0, Number((product.stock + delta).toFixed(3)))}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            {/* Selector de Motivo */}
            <Input
              type="select"
              label="Motivo del Ajuste"
              value={reason}
              onChange={(e) => setReason(e.target.value as StockMovementType)}
              options={[
                { value: "correction", label: "Corrección de Error" },
                { value: "loss", label: "Pérdida (Rotura/Vencido)" },
                { value: "consumption", label: "Consumo" },
              ]}
            />

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">
                Observaciones (Opcional)
              </label>
              <textarea
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-primary font-medium text-sm transition-colors min-h-[100px] resize-none"
                placeholder="Ej: 'Se rompió al acomodar la estantería' o 'Pedido del proveedor X'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {!isAdmin && (
            <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <p className="text-xs font-bold text-warning-dark">
                Esta acción requiere autorización de un administrador mediante
                PIN.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveClick}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              <Save className="w-5 h-5" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <AuthPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          handleConfirmAdjustment();
        }}
        title="Autorizar Ajuste de Stock"
      />
    </>
  );
}
