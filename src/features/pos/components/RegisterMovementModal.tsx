"use client";

import { useState } from "react";
// @ts-ignore
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/features/auth/stores";
import { useCashSessionStore } from "../stores/useCashSessionStore";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Modal } from "@/components/ui/dialog/Modal";
import { Input } from "@/components/Input";
import { Plus, Check, X, Loader2, DollarSign, Text } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSuppliers,
  createSupplier,
  type Supplier,
} from "@/features/suppliers/api/suppliersDb";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  description: z.string().min(3, "La descripción es muy corta"),
  supplierId: z.string().min(1, "Debe seleccionar un proveedor"),
  paymentMethod: z.enum(["cash", "transfer", "card", "debt"]),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface Props {
  onClose: () => void;
}

export const RegisterMovementModal = ({ onClose }: Props) => {
  const { dbUser } = useAuthStore();
  const { activeSession, updateSession } = useCashSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    // @ts-ignore
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      supplierId: "",
      paymentMethod: "cash",
    },
  });

  const selectedSupplierId = watch("supplierId");
  const selectedPaymentMethod = watch("paymentMethod");

  const handleQuickAddSupplier = async () => {
    if (!newSupplierName.trim()) return;

    // Validar duplicados
    const isDuplicate = suppliers.some(
      (s: Supplier) =>
        s.name.trim().toLowerCase() === newSupplierName.trim().toLowerCase(),
    );

    if (isDuplicate) {
      toast.error("Ese proveedor ya existe");
      return;
    }

    try {
      const supplier = await createSupplier(newSupplierName.trim());
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setValue("supplierId", supplier.id);
      setShowAddSupplier(false);
      setNewSupplierName("");
      toast.success("Proveedor agregado");
    } catch (error) {
      toast.error("Error al agregar proveedor");
    }
  };

  const onSubmit = async (data: ExpenseForm) => {
    if (!dbUser || !activeSession) return;
    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);
      const movementRef = doc(collection(db, "cash_movements"));

      const newMovement = {
        id: movementRef.id,
        sessionId: activeSession.id,
        employeeId: dbUser.uid,
        amount: data.amount,
        type: "supplier_payment" as const,
        paymentMethod: data.paymentMethod,
        description: data.description,
        supplierId: data.supplierId || null,
        paidAmount: data.paymentMethod === "debt" ? 0 : data.amount,
        status: data.paymentMethod === "debt" ? "pending" : "paid",
      };

      batch.set(movementRef, {
        ...newMovement,
        createdAt: serverTimestamp(),
      });

      // Si es efectivo, descontar de la caja de la sesión actual
      if (data.paymentMethod === "cash") {
        const sessionRef = doc(db, "cash_sessions", activeSession.id);
        batch.update(sessionRef, {
          totalMovements: increment(data.amount),
        });

        updateSession({
          totalMovements: (activeSession.totalMovements || 0) + data.amount,
        });
      }

      // Actualizar saldos del proveedor
      if (data.supplierId) {
        const supplierRef = doc(db, "suppliers", data.supplierId);
        if (data.paymentMethod === "debt") {
          // Si es fiado, aumenta la deuda pendiente
          batch.update(supplierRef, {
            totalPending: increment(data.amount),
          });
        } else {
          // Si es pago (cash, transfer, card), aumenta el total pagado
          batch.update(supplierRef, {
            totalPaid: increment(data.amount),
          });
        }
      }

      await batch.commit();

      toast.success("Egreso registrado correctamente");
      onClose();
    } catch (error) {
      console.error("Error al registrar egreso:", error);
      toast.error("Hubo un error al guardar el movimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={isSubmitting ? () => {} : onClose}
      title="Salida de Efectivo"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
        <div
          className={`p-3 rounded-lg border mb-6 ${
            selectedPaymentMethod === "cash"
              ? "bg-danger/10 border-danger/50"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              selectedPaymentMethod === "cash"
                ? "text-danger-dark"
                : "text-blue-700"
            }`}
          >
            {selectedPaymentMethod === "cash"
              ? "⚠️ Este retiro descontará del efectivo físico esperado al momento de hacer el Arqueo de Caja."
              : "ℹ️ Este movimiento quedará registrado como un egreso, pero NO afectará el efectivo esperado en el Arqueo de Caja."}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Monto ($)"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign className="h-5 w-5 text-gray-400" />}
            iconPosition="left"
            disabled={isSubmitting}
            autoFocus
            error={errors.amount?.message}
            {...register("amount")}
          />

          <Input
            label="Método de Pago"
            type="select"
            disabled={isSubmitting}
            options={[
              { label: "Efectivo (Caja)", value: "cash" },
              { label: "Transferencia", value: "transfer" },
              { label: "Tarjeta", value: "card" },
              { label: "Fiado / Pendiente de Pago", value: "debt" },
            ]}
            {...register("paymentMethod")}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">
                Proveedor
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddSupplier(!showAddSupplier);
                  setNewSupplierName("");
                }}
                className="text-xs font-bold cursor-pointer text-primary hover:text-primary-dark flex items-center gap-1"
              >
                {showAddSupplier ? (
                  <>
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Nuevo</span>
                  </>
                )}
              </button>
            </div>

            {showAddSupplier ? (
              <div className="flex gap-2 mt-[-4px]">
                <Input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleQuickAddSupplier}
                  disabled={isSubmitting || !newSupplierName.trim()}
                  className="cursor-pointer flex items-center justify-center w-12 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              <Input
                type="select"
                disabled={isSubmitting}
                className="mt-[-4px]"
                options={[
                  { label: "Seleccione un proveedor...", value: "" },
                  ...suppliers.map((s: Supplier) => ({
                    label: s.name,
                    value: s.id,
                  })),
                ]}
                error={errors.supplierId?.message}
                {...register("supplierId")}
              />
            )}
          </div>

          <Input
            label="Motivo / Comprobante"
            type="text"
            placeholder="Ej: Pago de pan"
            icon={<Text className="h-5 w-5 text-gray-400" />}
            iconPosition="left"
            disabled={isSubmitting}
            error={errors.description?.message}
            {...register("description")}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || showAddSupplier}
          variant="primary"
        >
          {isSubmitting ? "Registrando..." : "Confirmar Egreso"}
        </Button>
      </form>
    </Modal>
  );
};
