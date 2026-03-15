"use client";

import { useState } from "react";
// @ts-ignore
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { DollarSign, Text } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { Supplier } from "../types/supplier";
import { useAuthStore } from "@/features/auth/stores";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  description: z.string().min(3, "La descripción es muy corta"),
  paymentMethod: z.enum(["cash", "transfer", "card", "debt"]),
  supplierId: z.string().min(1, "Debe seleccionar un proveedor"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  initialSupplierId?: string;
}

export const RegisterSupplierPaymentModal = ({
  isOpen,
  onClose,
  suppliers,
  initialSupplierId,
}: Props) => {
  const { dbUser } = useAuthStore();
  const { activeSession, updateSession } = useCashSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [affectCashDrawer, setAffectCashDrawer] = useState(true);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentForm>({
    // @ts-ignore
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      description: "",
      supplierId: initialSupplierId || "",
      paymentMethod: "transfer",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");

  const onSubmit: SubmitHandler<PaymentForm> = async (data: PaymentForm) => {
    if (!dbUser) return;

    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);
      const movementRef = doc(collection(db, "cash_movements"));

      // Si elige efectivo pero no hay sesión, affectCashDrawer es irrelevante (es externo)
      const shouldAffectDrawer =
        activeSession && data.paymentMethod === "cash" && affectCashDrawer;

      const movementData = {
        id: movementRef.id,
        sessionId: shouldAffectDrawer ? activeSession.id : null,
        employeeId: dbUser.uid,
        amount: data.amount,
        type: "supplier_payment",
        paymentMethod: data.paymentMethod,
        description: data.description,
        supplierId: data.supplierId,
        paidAmount: data.paymentMethod === "debt" ? 0 : data.amount,
        status: data.paymentMethod === "debt" ? "pending" : "paid",
        createdAt: serverTimestamp(),
      };

      batch.set(movementRef, movementData);

      // Si es efectivo Y hay sesión Y el usuario eligió afectar caja, descontar de la caja
      if (shouldAffectDrawer) {
        const sessionRef = doc(db, "cash_sessions", activeSession.id);
        batch.update(sessionRef, {
          totalMovements: increment(data.amount),
        });
        updateSession({
          totalMovements: (activeSession.totalMovements || 0) + data.amount,
        });
      }

      // Actualizar saldos del proveedor
      const supplierRef = doc(db, "suppliers", data.supplierId);
      if (data.paymentMethod === "debt") {
        batch.update(supplierRef, {
          totalPending: increment(data.amount),
        });
      } else {
        batch.update(supplierRef, {
          totalPaid: increment(data.amount),
        });
      }

      await batch.commit();

      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Operación registrada correctamente");
      onClose();
    } catch (error) {
      console.error("Error al registrar pago:", error);
      toast.error("Hubo un error al guardar el registro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Registrar Compra / Pago"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="space-y-1">
          <label className="text-sm font-bold text-gray-700">Proveedor</label>
          <Input
            type="select"
            disabled={isSubmitting}
            className="mt-[-4px]"
            options={[
              { label: "Seleccione un proveedor...", value: "" },
              ...suppliers.map((s) => ({ label: s.name, value: s.id })),
            ]}
            error={errors.supplierId?.message}
            {...register("supplierId")}
          />
        </div>

        <Input
          label="Monto ($)"
          type="number"
          step="0.01"
          placeholder="0.00"
          icon={<DollarSign className="h-5 w-5 text-gray-400" />}
          iconPosition="left"
          disabled={isSubmitting}
          error={errors.amount?.message}
          {...register("amount")}
        />

        <Input
          label="Método de Pago"
          type="select"
          disabled={isSubmitting}
          options={[
            { label: "Transferencia (Dueño)", value: "transfer" },
            { label: "Tarjeta", value: "card" },
            { label: "Efectivo", value: "cash" },
            { label: "Fiado (Deuda)", value: "debt" },
          ]}
          {...register("paymentMethod")}
        />

        {selectedPaymentMethod === "cash" && (
          <div className="flex items-center gap-2 p-3 bg-primary-light/30 rounded-xl border border-primary-light/30 mb-2">
            <input
              type="checkbox"
              id="affectCashDrawer"
              checked={affectCashDrawer && !!activeSession}
              onChange={(e) => setAffectCashDrawer(e.target.checked)}
              disabled={!activeSession}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="affectCashDrawer"
              className={`text-sm font-bold ${!activeSession ? "text-gray-400" : "text-primary cursor-pointer"}`}
            >
              {activeSession
                ? "¿Descontar de la caja actual?"
                : "Caja cerrada (efectivo externo)"}
            </label>
          </div>
        )}

        <Input
          label="Motivo / Comprobante"
          type="text"
          placeholder="Ej: Factura A - Mes Marzo"
          icon={<Text className="h-5 w-5 text-gray-400" />}
          iconPosition="left"
          disabled={isSubmitting}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="pt-4 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registrando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
