"use client";

import { useState, useRef } from "react";
// @ts-ignore
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCashSessionStore } from "../stores/useCashSessionStore";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DollarSign, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { ZReportTicket } from "./ZReportTicket";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Modal } from "@/components/ui/dialog/Modal/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

const closeSessionSchema = z.object({
  closingAmount: z.coerce.number().min(0, "El monto no puede ser negativo"),
});

type CloseSessionForm = z.infer<typeof closeSessionSchema>;

interface Props {
  onClose: () => void;
}

export const CloseSessionZReport = ({ onClose }: Props) => {
  const { activeSession, clearSession } = useCashSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [ticketData, setTicketData] = useState<{
    employeeId: string;
    openingAmount: number;
    totalMovements: number;
    closingAmount: number;
    systemCalculated: number;
    difference: number;
    dateStr: string;
  } | null>(null); // Guardar info para impresión

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    onAfterPrint: () => {
      clearSession();
      onClose();
      setTicketData(null);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CloseSessionForm>({
    // @ts-ignore
    resolver: zodResolver(closeSessionSchema),
    defaultValues: { closingAmount: 0 },
  });

  const onSubmit: SubmitHandler<any> = async (data: any) => {
    if (!activeSession) return;
    setIsSubmitting(true);

    try {
      // 1. CÁLCULO DE SISTEMA: Apertura - Egresos Acumulados (+ Ventas en Fase 4)
      const expectedSystemAmount =
        activeSession.openingAmount - (activeSession.totalMovements || 0);
      const difference = data.closingAmount - expectedSystemAmount;

      const sessionRef = doc(db, "cash_sessions", activeSession.id);

      await updateDoc(sessionRef, {
        status: "closed",
        closingAmount: data.closingAmount,
        systemCalculated: expectedSystemAmount,
        difference: difference,
        closedAt: serverTimestamp(),
      });

      // 2. Imprimir ticket en lugar de solo logs
      toast.success("Caja cerrada exitosamente. Imprimiendo Ticket Z...");

      setTicketData({
        employeeId: activeSession.employeeId,
        openingAmount: activeSession.openingAmount,
        totalMovements: activeSession.totalMovements || 0,
        closingAmount: data.closingAmount,
        systemCalculated: expectedSystemAmount,
        difference: difference,
        dateStr: format(new Date(), "PPpp", { locale: es }),
      });

      // Esperar un ciclo para que el ticket oculto reciba los props
      setTimeout(() => {
        handlePrint();
      }, 100);
    } catch (error) {
      console.error("Error al cerrar caja:", error);
      toast.error("Error al procesar el cierre de caja.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={isSubmitting ? () => {} : onClose}
      title="Cierre de Caja"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 mb-8">
          <Input
            label="Efectivo Total"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign className="h-5 w-5 text-gray-400" />}
            iconPosition="left"
            className="text-2xl font-bold border-2"
            disabled={isSubmitting}
            autoFocus
            error={errors.closingAmount?.message}
            {...register("closingAmount")}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} variant="primary">
          {isSubmitting ? "Imprimiendo Resumen..." : "Confirmar y Cerrar Caja"}
        </Button>
      </form>

      {/* Componente Oculto para Impresión */}
      {ticketData && (
        <ZReportTicket
          ref={ticketRef}
          employeeId={ticketData.employeeId}
          openingAmount={ticketData.openingAmount}
          totalMovements={ticketData.totalMovements}
          closingAmount={ticketData.closingAmount}
          systemCalculated={ticketData.systemCalculated}
          difference={ticketData.difference}
          dateStr={ticketData.dateStr}
        />
      )}
    </Modal>
  );
};
