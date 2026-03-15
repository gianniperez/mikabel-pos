import { useState } from "react";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { usePosStore, type PaymentMethod } from "../stores/usePosStore";
import { useCashSessionStore } from "../stores/useCashSessionStore";
import { Banknote, CreditCard, BookUser, BanknoteArrowUp } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useRef, useState as useReactState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { SalesTicket } from "./SalesTicket";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/features/debts/api/debtsDb";
import { Input } from "@/components/Input";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal = ({ isOpen, onClose }: CheckoutModalProps) => {
  const {
    cartSubtotal,
    cartTotal,
    discount,
    surcharge,
    cart,
    paymentMethod,
    setPaymentMethod,
    enqueueTicket,
    clearCart,
    updateLocalStock,
  } = usePosStore();

  const { activeSession } = useCashSessionStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isMixedPayment, setIsMixedPayment] = useState(false);

  // Estados para Pagos Mixtos (Inputs manuales)
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedTransfer, setMixedTransfer] = useState<number>(0);
  const [mixedCard, setMixedCard] = useState<number>(0);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  // Estados para Pagos Mixtos (Fase Opcional futura, por ahora todo va al paymentMethod actual)
  const [cashAmount, setCashAmount] = useState<number>(cartTotal);

  // Mantenemos sincronizado el input con el total (si cambia el carrito de fondo)
  if (cashAmount !== cartTotal && isOpen && paymentMethod !== "cash") {
    // Si no es efectivo, asumimos que pagan justo el total
    // setCashAmount(cartTotal);
  }

  // ==== LÓGICA DE IMPRESIÓN ====
  const componentRef = useRef<HTMLDivElement>(null);

  // Guardamos una "foto" del ticket para imprimir, así podemos vaciar el carrito inmediatamente
  const [frozenTicket, setFrozenTicket] = useReactState<
    | (import("../stores/usePosStore").PendingTicket & { cashAmount?: number })
    | null
  >(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ticket_${frozenTicket?.id || "Venta"}`,
    onAfterPrint: () => {
      setFrozenTicket(null);
      onClose();
    },
    onPrintError: () => {
      setFrozenTicket(null);
      onClose();
    },
  });

  // Efecto: Cuando tenemos un ticket congelado listo, gatillamos la impresión
  useEffect(() => {
    if (frozenTicket) {
      // Timeout to ensure <SalesTicket> has been rendered and ref is attached
      const timer = setTimeout(() => {
        handlePrint();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [frozenTicket, handlePrint]);

  const handleConfirmCheckout = async () => {
    if (!activeSession) {
      toast.error("No hay un turno activo para procesar la venta");
      return;
    }

    if (paymentMethod === "debt" && !selectedCustomerId) {
      toast.error("Debes seleccionar un cliente.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Crear Objeto Ticket para la Cola Optimista
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newTicket: any = {
        id: ticketId,
        items: [...cart],
        subtotal: cartSubtotal,
        discount: discount,
        surcharge: surcharge,
        total: cartTotal,
        paymentMethod: paymentMethod,
        timestamp: Date.now(),
        sessionId: activeSession.id,
        employeeId: activeSession.employeeId,
        status: "pending" as const,
      };

      if (paymentMethod === "debt" && selectedCustomerId) {
        newTicket.customerId = selectedCustomerId;
      }

      if (isMixedPayment) {
        // En pago mixto, guardamos el desglose. El método principal es el que "emite" el ticket.
        newTicket.splitPayments = {
          cash:
            paymentMethod === "cash"
              ? Math.max(0, cartTotal - mixedTransfer - mixedCard)
              : mixedCash,
          transfer:
            paymentMethod === "transfer"
              ? Math.max(0, cartTotal - mixedCash - mixedCard)
              : mixedTransfer,
          card:
            paymentMethod === "card"
              ? Math.max(0, cartTotal - mixedCash - mixedTransfer)
              : mixedCard,
        };
      }

      // 2. CONGELAR TICKET PARA IMPRESIÓN (Disparará handlePrint vía useEffect)
      setFrozenTicket({
        ...newTicket,
        cashAmount: paymentMethod === "cash" ? cashAmount : undefined,
      });

      // 3. ACTUALIZACIÓN LOCAL (Stock en Dexie)
      await updateLocalStock(newTicket.items);

      // 4. ENCOLAR Y VACIAR (Zero-Latency Rule)
      // Lo hacemos antes de hablar con Firebase para liberar la UI inmediatamente
      enqueueTicket(newTicket);
      clearCart();
      // No hacemos onClose() aquí para permitir que react-to-print capture el HTML oculto
      // onClose se dispara en onAfterPrint o onPrintError
      toast.success("Venta resgistrada (Cola Optimista)");

      // 5. El hook usePosSyncLoop se encargará de subirlo a Firebase
      // de forma atómica e idempotente.
    } catch (error) {
      console.error("Error en checkout:", error);
      toast.error("Error crítico al procesar cobro");
    } finally {
      setIsProcessing(false); // Por si falló antes del onClose
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return <Banknote className="w-6 h-6" />;
      case "transfer":
        return <BanknoteArrowUp className="w-6 h-6" />;
      case "card":
        return <CreditCard className="w-6 h-6" />;
      case "debt":
        return <BookUser className="w-6 h-6" />;
    }
  };

  const getMethodName = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "Efectivo";
      case "transfer":
        return "Transf";
      case "card":
        return "Tarjeta";
      case "debt":
        return "Fiado";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isProcessing && onClose()}
      title="Confirmar Cobro"
      description={`${cart.length} items en el ticket`}
    >
      <div className="space-y-6">
        {/* Total a Cobrar Jumbo */}
        <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-gray-200">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Total a Cobrar
          </span>
          <span className="text-6xl font-black text-gray-900">
            ${cartTotal}
          </span>
          {(surcharge > 0 || discount > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-1 w-full max-w-xs mx-auto">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>${cartSubtotal}</span>
              </div>
              {surcharge > 0 && (
                <div className="flex justify-between text-xs font-bold text-red-500 uppercase tracking-widest">
                  <span>Recargo</span>
                  <span>+${surcharge}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-xs font-bold text-green-500 uppercase tracking-widest">
                  <span>Descuento</span>
                  <span>-${discount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Método Actual y Selectores */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700">
            Medio de Pago
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["cash", "transfer", "card", "debt"] as PaymentMethod[]).map(
              (method) => (
                <Button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  variant={paymentMethod === method ? "primary" : "outline"}
                  className="h-auto flex-col items-center justify-center py-4 px-1 mt-2"
                >
                  {getMethodIcon(method)}
                  <span className="text-[10px] font-black uppercase mt-2">
                    {getMethodName(method)}
                  </span>
                </Button>
              ),
            )}
          </div>
        </div>

        {/* Toggle Pago Mixto */}
        <div className="flex items-center justify-between p-4 bg-primary-light/10 border border-primary/20 rounded-xl">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">¿Pago Mixto?</span>
            <span className="text-[10px] text-gray-500 font-medium">
              Efectivo + Transferencia + Tarjeta
            </span>
          </div>
          <button
            onClick={() => {
              setIsMixedPayment(!isMixedPayment);
              setMixedCash(0);
              setMixedTransfer(0);
              setMixedCard(0);
            }}
            className={clsx(
              "cursor-pointer w-12 h-6 rounded-full transition-colors relative",
              isMixedPayment ? "bg-primary" : "bg-gray-300",
            )}
          >
            <div
              className={clsx(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                isMixedPayment ? "left-7" : "left-1",
              )}
            />
          </button>
        </div>

        {/* Inputs de Pago Mixto */}
        {isMixedPayment && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-3 gap-3">
              {/* Efectivo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                  Efectivo
                </label>
                {paymentMethod === "cash" ? (
                  <div className="h-[42px] flex items-center justify-center bg-primary/5 border border-primary/20 rounded-xl font-black text-sm text-primary">
                    ${Math.max(0, cartTotal - mixedTransfer - mixedCard)}
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={mixedCash || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const max = cartTotal - mixedTransfer - mixedCard;
                      setMixedCash(val > max ? max : val);
                    }}
                    className="h-10 text-sm font-bold"
                    placeholder="$0"
                  />
                )}
              </div>

              {/* Transferencia */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                  Transf.
                </label>
                {paymentMethod === "transfer" ? (
                  <div className="h-[42px] flex items-center justify-center bg-primary/5 border border-primary/20 rounded-xl font-black text-sm text-primary">
                    ${Math.max(0, cartTotal - mixedCash - mixedCard)}
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={mixedTransfer || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const max = cartTotal - mixedCash - mixedCard;
                      setMixedTransfer(val > max ? max : val);
                    }}
                    className="h-10 text-sm font-bold"
                    placeholder="$0"
                  />
                )}
              </div>

              {/* Tarjeta */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                  Tarjeta
                </label>
                {paymentMethod === "card" ? (
                  <div className="h-[42px] flex items-center justify-center bg-primary/5 border border-primary/20 rounded-xl font-black text-sm text-primary">
                    ${Math.max(0, cartTotal - mixedCash - mixedTransfer)}
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={mixedCard || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const max = cartTotal - mixedCash - mixedTransfer;
                      setMixedCard(val > max ? max : val);
                    }}
                    className="h-10 text-sm font-bold"
                    placeholder="$0"
                  />
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center italic">
              El método seleccionado arriba se completará automáticamente.
            </p>
          </div>
        )}

        {/* Simulador de Vuelto (Opcional, solo Efectivo) */}
        {paymentMethod === "cash" && (
          <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-gray-700">
              Paga con...
            </label>
            <div className="relative">
              <Input
                type="number"
                disabled={isProcessing}
                value={cashAmount || ""}
                onChange={(e) => setCashAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-4 mt-2 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 font-black text-xl text-gray-900 transition-colors"
                placeholder={"$" + cartTotal.toString()}
              />
            </div>

            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-bold text-gray-500">Vuelto:</span>
              <span
                className={clsx(
                  "text-2xl font-black",
                  cashAmount >= cartTotal ? "text-green-600" : "text-red-500",
                )}
              >
                ${Math.max(0, cashAmount - cartTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Selector de Cliente (Solo Fiado) */}
        {paymentMethod === "debt" && (
          <div className="space-y-3 pt-2">
            <Input
              type="select"
              label="Anotar Cuenta Corriente a:"
              disabled={isProcessing}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={[
                { value: "", label: "-- Selecciona un Cliente --" },
                ...customers.map(
                  (c: { id: string; name: string; totalDebt: number }) => ({
                    value: c.id,
                    label: `${c.name} (Deuda: $${c.totalDebt})`,
                  }),
                ),
              ]}
            />
          </div>
        )}

        {/* Acción Final */}
        <div>
          <Button
            onClick={handleConfirmCheckout}
            disabled={isProcessing || cart.length === 0}
            variant="primary"
          >
            {isProcessing
              ? "Procesando..."
              : `Confirmar Cobro ($${cartTotal}) `}
          </Button>
        </div>
      </div>

      {frozenTicket && (
        <SalesTicket
          ref={componentRef}
          ticketId={frozenTicket.id}
          items={frozenTicket.items}
          total={frozenTicket.total}
          paymentMethod={frozenTicket.paymentMethod}
          timestamp={frozenTicket.timestamp}
          cashAmount={frozenTicket.cashAmount}
        />
      )}
    </Modal>
  );
};
