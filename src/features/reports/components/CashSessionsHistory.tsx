import { useQuery } from "@tanstack/react-query";
import { getCashSessionsHistory } from "../api/reportsDb";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const CashSessionsHistory = () => {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["cash-sessions-history"],
    queryFn: () => getCashSessionsHistory(30),
  });

  if (isLoading)
    return (
      <div className="py-10 text-center animate-pulse">
        Cargando arqueos históricos...
      </div>
    );
  if (sessions.length === 0)
    return (
      <div className="py-10 text-center text-gray-500">
        No hay historial de cajas cerradas.
      </div>
    );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Apertura</th>
              <th className="px-6 py-4">Cierre</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Fondo Base</th>
              <th className="px-6 py-4 text-right">Ingreso Efectivo</th>
              <th className="px-6 py-4 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((session) => {
              const openDate = new Date(session.openedAt);
              const closeDate = session.closedAt
                ? new Date(session.closedAt)
                : null;

              const isValidOpen = !isNaN(openDate.getTime());
              const isValidClose = closeDate && !isNaN(closeDate.getTime());

              // Total Efectivo Físico esperado por sistema (Apertura + Ventas Efvo + Cobros Fiado)
              // (Simplificación para la vista)
              const realCashInbox = session.closingAmount || 0;
              const isClosed = session.status === "closed";
              const diff = session.difference || 0;

              return (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                      {isValidOpen
                        ? format(openDate, "dd MMM", { locale: es })
                        : "S/D"}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {isValidOpen ? format(openDate, "HH:mm") : "--:--"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isValidClose ? (
                      <>
                        <div className="font-bold text-gray-900">
                          {format(closeDate, "dd MMM", { locale: es })}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {format(closeDate, "HH:mm")}
                        </div>
                      </>
                    ) : isClosed ? (
                      <span className="text-gray-400">Sin fecha</span>
                    ) : (
                      <span className="text-gray-400 italic">En curso...</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${isClosed ? "bg-gray-200 text-gray-800" : "bg-success-light/30 text-success"}`}
                    >
                      {isClosed ? "CERRADA" : "ACTIVA"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    ${session.openingAmount.toLocaleString("es-AR")}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    ${isClosed ? realCashInbox.toLocaleString("es-AR") : "---"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isClosed ? (
                      <span
                        className={`font-black ${diff === 0 ? "text-success" : diff > 0 ? "text-primary" : "text-danger"}`}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff.toLocaleString("es-AR")}
                      </span>
                    ) : (
                      <span className="text-gray-300">---</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
