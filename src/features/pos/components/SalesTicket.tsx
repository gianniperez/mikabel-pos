import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CartItem, PaymentMethod } from "../stores/usePosStore";

interface SalesTicketProps {
  ticketId: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: number;
  cashAmount?: number; // Cuánto pagó en efectivo (para calcular vuelto)
  splitPayments?: {
    cash: number;
    transfer: number;
    card?: number;
    debt?: number;
  };
}

const getMethodName = (method: PaymentMethod) => {
  switch (method) {
    case "cash":
      return "EFECTIVO";
    case "transfer":
      return "TRANSFERENCIA";
    case "card":
      return "TARJETA";
    case "debt":
      return "FIADO/LIBRETA";
  }
};

export const SalesTicket = React.forwardRef<HTMLDivElement, SalesTicketProps>(
  (
    {
      ticketId,
      items,
      total,
      paymentMethod,
      timestamp,
      cashAmount,
      splitPayments,
    },
    ref,
  ) => {
    const dateStr = format(new Date(timestamp), "dd/MM/yyyy HH:mm", {
      locale: es,
    });
    const vuelto =
      paymentMethod === "cash" && cashAmount
        ? Math.max(0, cashAmount - total)
        : 0;

    return (
      <div className="opacity-0 pointer-events-none absolute -z-50 top-0 left-0 overflow-hidden w-0 h-0">
        <div
          ref={ref}
          className="text-black font-mono w-[300px] p-4 text-sm bg-white block"
        >
          <div className="text-center mb-4 flex flex-col items-center">
            <img
              src="/isologo.png"
              alt="Mikabel Logo"
              className="w-16 h-16 object-contain mb-2 filter grayscale brightness-50 contrast-150"
            />
            <h1 className="font-bold text-xl mb-1 mt-1">MIKABEL</h1>
            <p className="text-xs">TICKET DE VENTA (NO VALIDO COMO FACTURA)</p>
            <p className="text-xs">{dateStr}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              Ticket #{ticketId.substring(0, 8)}
            </p>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          <div className="flex justify-between font-bold text-xs mb-2">
            <span className="w-1/2">Cant x Desc</span>
            <span className="w-1/4 text-right">P.U.</span>
            <span className="w-1/4 text-right">Total</span>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* LISTA DE ITEMS */}
          <div className="space-y-3 my-2 text-xs">
            {items.map((item) => (
              <div key={item.product.id} className="flex flex-col">
                <span className="font-bold truncate">{item.product.name}</span>
                <div className="flex justify-between text-gray-800">
                  <span className="w-1/2">
                    {item.quantity} x {item.isBulkPriceApplied ? "Pack" : "Un"}
                  </span>
                  <span className="w-1/4 text-right">
                    $
                    {item.isBulkPriceApplied
                      ? item.product.bulkPrice
                      : item.product.salePrice}
                  </span>
                  <span className="w-1/4 text-right font-bold">
                    ${item.subtotal}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-solid border-black my-2 mt-4"></div>

          {/* TOTALES */}
          <div className="space-y-1 my-2">
            <div className="space-y-0.5 border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between text-[10px]">
                <span>Subtotal:</span>
                <span>
                  $
                  {items
                    .reduce((acc, item) => acc + item.subtotal, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between font-black text-lg">
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs mt-2">
              <span>Medio de Pago:</span>
              <span className="font-bold">{getMethodName(paymentMethod)}</span>
            </div>

            {paymentMethod === "cash" && cashAmount && (
              <>
                <div className="flex justify-between text-xs">
                  <span>Paga con:</span>
                  <span>${cashAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Vuelto:</span>
                  <span>${vuelto.toFixed(2)}</span>
                </div>
              </>
            )}

            {splitPayments && (
              <div className="border-t border-dotted border-black pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>Detalle de Pago:</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Efectivo:</span>
                  <span>${splitPayments.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Transferencia:</span>
                  <span>${splitPayments.transfer.toFixed(2)}</span>
                </div>
                {splitPayments.card && splitPayments.card > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Tarjeta:</span>
                    <span>${splitPayments.card.toFixed(2)}</span>
                  </div>
                )}
                {splitPayments.debt && splitPayments.debt > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Fiado:</span>
                    <span>${splitPayments.debt.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-4"></div>

          <div className="text-center mb-8 mt-6">
            <p className="text-xs font-bold">¡Gracias por su compra!</p>
          </div>
        </div>
      </div>
    );
  },
);

SalesTicket.displayName = "SalesTicket";
