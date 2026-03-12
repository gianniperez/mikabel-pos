import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { Wallet, Clock } from "lucide-react";
import Link from "next/link";

export const CashSessionWidget = () => {
  const { activeSession } = useCashSessionStore();

  if (!activeSession) {
    return (
      <Link
        href="/pos"
        className="block transform transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3 h-full cursor-pointer hover:border-gray-200">
          <div className="p-4 bg-gray-50 text-gray-400 rounded-full">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900">Caja Cerrada</h3>
          <p className="text-sm text-gray-500">
            Inicia una sesión para empezar a vender.
          </p>
        </div>
      </Link>
    );
  }

  const openDate = (activeSession.openedAt as { toDate?: () => Date })?.toDate
    ? (activeSession.openedAt as { toDate?: () => Date }).toDate!()
    : new Date(activeSession.openedAt as string | number | Date);

  return (
    <Link
      href="/pos"
      className="block transform transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="bg-white border-2 border-success-light/50 rounded-3xl p-6 shadow-sm overflow-hidden relative h-full cursor-pointer hover:border-success-light">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-success-light/30 text-success rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Estado de Caja
            </h3>
            <p className="text-xs font-medium text-success uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Sesión Abierta
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-50">
            <span className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Apertura
            </span>
            <span className="font-black text-gray-900">
              {format(openDate, "HH:mm 'hs'", { locale: es })}
            </span>
          </div>

          <div className="pt-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Ventas Totales
            </span>
            <span className="text-4xl font-black text-gray-900">
              $
              {((activeSession as unknown as Record<string, number>).totalCashSales || 0) +
                ((activeSession as unknown as Record<string, number>).totalTransferSales || 0)}
            </span>
          </div>
        </div>

        {/* Visual touch */}
        <div className="absolute -bottom-6 -right-6 text-green-50 opacity-10 transform -rotate-12">
          <Wallet className="w-32 h-32" />
        </div>
      </div>
    </Link>
  );
};
