"use client";

import { useState } from "react";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { ClosedRegisterView } from "@/features/pos/components/ClosedRegisterView";
import { ActivePosTerminal } from "@/features/pos/components/ActivePosTerminal";
import { RegisterMovementModal } from "@/features/pos/components/RegisterMovementModal";
import { CloseSessionZReport } from "@/features/pos/components/CloseSessionZReport";
import { SessionTicketsModal } from "@/features/pos/components/SessionTicketsModal";
import { ArrowDownToLine, Calculator, ReceiptText } from "lucide-react";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Button } from "@/components/Button";

export default function PosPage() {
  usePageMetadata({
    title: "Caja",
    description: "Terminal de punto de venta y cierre de jornada",
  });
  const { isOpen } = useCashSessionStore();
  const { dbUser } = useAuthStore();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  // Si la caja está cerrada, mostrar la vista de bloqueo
  if (!isOpen) {
    return <ClosedRegisterView />;
  }

  // Si está abierta, mostrar la terminal POS real con su TopBar de Cajero
  return (
    <div className="flex flex-col h-screen rounded-mikabel">
      {/* Header exclusivo de la Caja */}
      <header className="bg-white rounded-mikabel border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="font-semibold text-gray-700">
            Turno Activo: {dbUser?.name.split(" ")[0]}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsTicketsModalOpen(true)}
            className="py-2 px-3 text-sm"
            variant="secondary"
          >
            <ReceiptText className="w-4 h-4" />
            Ventas
          </Button>

          <Button
            onClick={() => setIsMovementModalOpen(true)}
            className="py-2 px-3 text-sm"
            variant="destructive"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Egreso
          </Button>
          <Button
            onClick={() => setIsCloseModalOpen(true)}
            className="py-2 px-3 text-sm"
            variant="outline"
          >
            <Calculator className="w-4 h-4" />
            Cierre
          </Button>
        </div>
      </header>

      {/* Terminal Real */}
      <main className="flex-1 overflow-hidden relative">
        <ActivePosTerminal />
      </main>

      {/* Modales */}
      {isTicketsModalOpen && (
        <SessionTicketsModal
          isOpen={isTicketsModalOpen}
          onClose={() => setIsTicketsModalOpen(false)}
        />
      )}
      {isMovementModalOpen && (
        <RegisterMovementModal onClose={() => setIsMovementModalOpen(false)} />
      )}
      {isCloseModalOpen && (
        <CloseSessionZReport onClose={() => setIsCloseModalOpen(false)} />
      )}
    </div>
  );
}
