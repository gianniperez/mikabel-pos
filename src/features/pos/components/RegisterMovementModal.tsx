"use client";

import { useState } from "react";
// @ts-expect-error Typescript ESM resolution issue con RHF v7
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
import { DollarSign, Text } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Modal } from "@/components/ui/dialog/Modal";
import { Input } from "@/components/Input";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  description: z.string().min(3, "La descripción es muy corta"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface Props {
  onClose: () => void;
}

export const RegisterMovementModal = ({ onClose }: Props) => {
  const { dbUser } = useAuthStore();
  const { activeSession, updateSession } = useCashSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: 0, description: "" },
  });

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
        description: data.description,
      };

      batch.set(movementRef, {
        ...newMovement,
        createdAt: serverTimestamp(),
      });

      const sessionRef = doc(db, "cash_sessions", activeSession.id);
      batch.update(sessionRef, {
        totalMovements: increment(data.amount),
      });

      await batch.commit();

      // Actualizar caché local
      updateSession({
        totalMovements: (activeSession.totalMovements || 0) + data.amount,
      });

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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-danger/10 p-3 rounded-lg border border-danger/50 mb-6">
          <p className="text-xs text-danger-dark font-medium">
            ⚠️ Este retiro descontará del efectivo físico esperado al momento de
            hacer el <b>Arqueo de Caja</b>.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Monto Retirado ($)"
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

        <Button type="submit" disabled={isSubmitting} variant="primary">
          {isSubmitting ? "Registrando..." : "Confirmar Egreso"}
        </Button>
      </form>
    </Modal>
  );
};
