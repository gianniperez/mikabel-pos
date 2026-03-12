import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ZReportTicketProps {
  employeeId: string;
  openingAmount: number;
  totalMovements: number;
  closingAmount: number;
  systemCalculated: number;
  difference: number;
  dateStr: string;
}

export const ZReportTicket = React.forwardRef<
  HTMLDivElement,
  ZReportTicketProps
>(
  (
    {
      employeeId,
      openingAmount,
      totalMovements,
      closingAmount,
      systemCalculated,
      difference,
      dateStr,
    },
    ref,
  ) => {
    // Ancho fijo pequeño para emular ticket térmico (e.g. 58mm -> ~210px, 80mm -> ~300px)
    return (
      <div className="hidden">
        {/* Usamos @media print en globales, o estilos en línea, o simplemente lo ocultamos en web */}
        <div
          ref={ref}
          className="text-black font-mono w-[300px] p-4 text-sm bg-white print:block"
        >
          <div className="text-center mb-4 flex flex-col items-center">
            <img
              src="/isologo.png"
              alt="Mikabel Logo"
              className="w-16 h-16 object-contain mb-2 filter grayscale brightness-50 contrast-150"
            />
            <h1 className="font-bold text-lg mb-1">MIKABEL</h1>
            <p className="text-xs">RESUMEN DE CIERRE (Z)</p>
            <p className="text-xs">{dateStr}</p>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="space-y-1 my-4">
            <div className="flex justify-between">
              <span>Cajero:</span>
              <span className="font-bold truncate max-w-[140px]">
                {employeeId}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className="font-bold">CERRADO</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="space-y-2 my-4">
            <div className="flex justify-between">
              <span>Caja Inicial:</span>
              <span>${openingAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Ventas Efectivo:</span>
              <span>$??.?? (Fase 4)</span>
            </div>

            <div className="flex justify-between">
              <span>Egresos Caja:</span>
              <span>$-{totalMovements.toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1"></div>

            <div className="flex justify-between font-bold">
              <span>Esperado SISTEMA:</span>
              <span>${systemCalculated.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold">
              <span>Declarado CAJERO:</span>
              <span>${closingAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold mt-2 text-base">
              <span>Diferencia:</span>
              <span>${difference.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-4"></div>

          <div className="text-center mb-8">
            <p className="text-xs mb-8">Firma del Cajero:</p>
            <div className="border-b border-gray-400 w-3/4 mx-auto mb-2"></div>
          </div>

          <p className="text-center text-xs mt-4">Generado por Mikabel POS</p>
        </div>
      </div>
    );
  },
);

ZReportTicket.displayName = "ZReportTicket";
