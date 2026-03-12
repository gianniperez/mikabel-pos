"use client";

import { useState } from "react";
// @ts-ignore
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCashSessionStore } from "../stores/useCashSessionStore";
import { CashSession } from "../types/cashSession";
import { useAuthStore } from "@/features/auth/stores";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/ui/dialog/Modal";
import { Input } from "@/components/Input";

const openSessionSchema = z.object({
  openingAmount: z.coerce
    .number()
    .min(0, "El monto no puede ser negativo")
    .default(0),
});

type OpenSessionForm = z.infer<typeof openSessionSchema>;

interface Props {
  onClose: () => void;
}

export const OpenSessionModal = ({ onClose }: Props) => {
  const { setSession } = useCashSessionStore();
  const { dbUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpenSessionForm>({
    // @ts-ignore
    resolver: zodResolver(openSessionSchema),
    defaultValues: { openingAmount: 0 },
  });

  const onSubmit: SubmitHandler<any> = async (data: any) => {
    if (!dbUser) return;
    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);
      const sessionRef = doc(collection(db, "cash_sessions"));

      const newSession: CashSession = {
        id: sessionRef.id,
        employeeId: dbUser.uid,
        status: "open" as const,
        openingAmount: data.openingAmount,
        totalMovements: 0,
        totalCashSales: 0,
        totalTransferSales: 0,
        totalDebtSales: 0,
        totalDebtPayments: 0,
        closingAmount: null,
        systemCalculated: null,
        difference: null,
        openedAt: Date.now(), // Para Zustand local guardamos en ms
        closedAt: null,
      };

      // Guardamos la versión con timestamp del server en Firestore
      batch.set(sessionRef, {
        ...newSession,
        openedAt: serverTimestamp(),
      });

      await batch.commit();

      // Guardamos la versión en ms en el estado global (Zustand)
      setSession(newSession);
      onClose();
    } catch (error) {
      console.error("Error al abrir caja:", error);
      alert("Hubo un error al abrir la caja. Revisa tu conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={isSubmitting ? () => {} : onClose}
      title="Apertura de Caja"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 mb-8">
          <Input
            label="Efectivo Inicial"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign className="h-5 w-5 text-gray-400" />}
            iconPosition="left"
            className="font-semibold text-gray-900 sm:text-lg"
            disabled={isSubmitting}
            autoFocus
            error={errors.openingAmount?.message}
            {...register("openingAmount")}
          />
          <p className="text-xs text-gray-500">
            Declara el efectivo con el que comienzas el turno para que el
            arqueo de cierre contemple este monto.
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting} variant="primary">
          {isSubmitting ? "Abriendo..." : "Confirmar Apertura"}
        </Button>
      </form>
    </Modal>
  );
};
