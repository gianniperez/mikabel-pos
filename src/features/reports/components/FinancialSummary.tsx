import { useQuery } from "@tanstack/react-query";
import { getCashSessionsHistory } from "../api/reportsDb";
import { Banknote, CreditCard, BookUser, TrendingUp } from "lucide-react";
import { subDays, startOfMonth, subMonths, startOfDay } from "date-fns";

interface Props {
  period: "7d" | "30d" | "thisMonth" | "lastMonth";
}

export const FinancialSummary = ({ period }: Props) => {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["cash-sessions-history", period],
    queryFn: () => {
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case "7d":
          startDate = startOfDay(subDays(now, 7));
          break;
        case "30d":
          startDate = startOfDay(subDays(now, 30));
          break;
        case "thisMonth":
          startDate = startOfMonth(now);
          break;
        case "lastMonth":
          startDate = startOfMonth(subMonths(now, 1));
          break;
        default:
          startDate = startOfDay(subDays(now, 30));
      }

      return getCashSessionsHistory(1000, startDate);
    },
  });

  if (isLoading)
    return <div className="h-40 animate-pulse bg-gray-100 rounded-3xl"></div>;

  // Filtrado adicional en cliente para el Mes Pasado (para excluir este mes)
  const filteredSessions = sessions.filter((s) => {
    if (period !== "lastMonth") return true;
    const sessionDate = new Date(s.openedAt);
    return sessionDate < startOfMonth(new Date());
  });

  // Agregación O(N) cliente de las sesiones filtradas
  const aggregated = filteredSessions.reduce(
    (acc, curr) => {
      // Si no es un número seguro, fallback a 0
      acc.cashSales += curr.totalCashSales || 0;
      acc.transferSales += curr.totalTransferSales || 0;
      acc.debtSales += curr.totalDebtSales || 0;
      acc.debtPayments += curr.totalDebtPayments || 0;
      return acc;
    },
    { cashSales: 0, transferSales: 0, debtSales: 0, debtPayments: 0 },
  );

  const totalBruto =
    aggregated.cashSales + aggregated.transferSales + aggregated.debtSales;
  const totalFisicoEntrante = aggregated.cashSales + aggregated.debtPayments; // Dinero real cobrado (Efvo + Cobro Fiados)

  return (
    <div className="space-y-6">
      {/* KPI Principal */}
      <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp className="w-48 h-48 rotate-12" />
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 uppercase tracking-widest text-sm font-bold mb-2">
            Ingreso Bruto de Ventas (
            {period === "7d"
              ? "Últimos 7 días"
              : period === "30d"
                ? "Últimos 30 días"
                : period === "thisMonth"
                  ? "Este Mes"
                  : "Mes Pasado"}
            )
          </p>
          <h2 className="text-7xl font-black tracking-tighter">
            ${totalBruto.toLocaleString("es-AR")}
          </h2>
          <p className="mt-4 text-blue-300 font-medium">
            Incluye ventas cobradas y fiados registrados en este periodo.
          </p>
        </div>
      </div>

      {/* Desglose Secundario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border-2 border-success-light flex gap-4">
          <div className="p-4 bg-success-light/30 text-success rounded-2xl h-fit">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">
              Efectivo Físico
            </p>
            <p className="text-3xl font-black text-gray-900 mt-1">
              ${totalFisicoEntrante.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Ventas (${aggregated.cashSales.toLocaleString("es-AR")}) + Abonos
              (${aggregated.debtPayments.toLocaleString("es-AR")})
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-secondary-light flex gap-4">
          <div className="p-4 bg-secondary-light/30 text-secondary rounded-2xl h-fit">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">
              Transferencias
            </p>
            <p className="text-3xl font-black text-gray-900 mt-1">
              ${aggregated.transferSales.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-terciary-light flex gap-4">
          <div className="p-4 bg-terciary-light/30 text-terciary rounded-2xl h-fit">
            <BookUser className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">
              Fiados (Deuda Emitida)
            </p>
            <p className="text-3xl font-black text-gray-900 mt-1">
              ${aggregated.debtSales.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
