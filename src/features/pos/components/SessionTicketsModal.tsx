"use client";

import { Modal } from "@/components/ui/dialog/Modal";
import { useSessionTickets } from "../hooks/useSessionTickets";
import { useCancelSale } from "../hooks/useCancelSale";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/features/auth/stores";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { AuthPinModal } from "@/components/ui/AuthPinModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";

interface SessionTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionTicketsModal = ({
  isOpen,
  onClose,
}: SessionTicketsModalProps) => {
  const { tickets, isLoading, hasMore, loadMore, refetch } = useSessionTickets();
  const { cancelSale, isCancelling } = useCancelSale();
  const { dbUser } = useAuthStore();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<string | null>(null);

  const handleCancelClick = (ticketId: string) => {
    setTicketToCancel(ticketId);
    setIsPinModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!ticketToCancel) return;

    const success = await cancelSale(ticketToCancel);
    if (success) {
      refetch();
    }
    setTicketToCancel(null);
    setIsConfirmModalOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ventas de la Sesión Actual"
      description="Listado de tickets cobrados desde que se abrió esta caja."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border-2 border-gray-200 rounded-xl flex items-center justify-between bg-white"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎟️</span>
            </div>
            <p className="font-bold">No hay ventas registradas</p>
            <p className="text-sm">Las ventas aparecerán aquí una vez que se realicen.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 border rounded-xl flex items-center justify-between ${
                  ticket.status === "cancelled"
                    ? "bg-danger-light/10 border-danger/40 border-2"
                    : "bg-white border-gray-300 border-2"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">
                      Ticket #{ticket.id.split("_")[1]}
                    </h4>
                    {ticket.status === "cancelled" && (
                      <span className="text-[10px] uppercase font-black bg-danger/20 text-danger px-2 py-0.5 rounded-full">
                        Anulado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(
                      ticket.createdAt?.toDate() || new Date(ticket.timestamp),
                      "HH:mm - dd/MM/yyyy",
                      { locale: es },
                    )}
                  </p>
                  <p className="text-xs font-bold text-gray-600 mt-0.5 uppercase">
                    Pago: {ticket.paymentMethod} • Items:{" "}
                    {ticket.items?.length || 0}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right flex-col md:flex-row">
                  <div className="flex flex-col">
                    <span className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                      Total
                    </span>
                    <span className="text-xl font-black text-gray-900">
                      ${ticket.total}
                    </span>
                  </div>

                  {/* Botón de Anular (Solo Tickets No Anulados) */}
                  {ticket.status !== "cancelled" && (
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelClick(ticket.id)}
                      disabled={isCancelling}
                      className="text-sm"
                    >
                      Anular
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
                className="w-full mt-2 font-bold uppercase text-xs tracking-widest"
              >
                {isLoading ? "Cargando..." : "Cargar más ventas anteriores"}
              </Button>
            )}
          </div>
        )}
      </div>

      <AuthPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Autorizar Anulación"
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Confirmar Anulación"
        description="Esta acción devolverá el stock y restará el dinero de la caja activa actual."
        confirmText="Sí, Anular"
        isLoading={isCancelling}
      />
    </Modal>
  );
};
