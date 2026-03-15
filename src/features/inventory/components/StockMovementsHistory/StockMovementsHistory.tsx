import { useStockMovements } from "../../hooks/useStockMovements";
import { useUsers } from "@/features/users/hooks/useUsers";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalProduct } from "@/lib/dexie";
import { Package, History, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockMovementType } from "@/types/models";
import Image from "next/image";

const getReasonLabel = (reason: StockMovementType) => {
  switch (reason) {
    case "correction":
      return {
        label: "Corrección",
        color: "bg-success-light/20 text-success-dark border-success-dark/30",
      };
    case "loss":
      return {
        label: "Pérdida/Rotura",
        color: "bg-danger/20 text-danger border-danger/30",
      };
    case "consumption":
      return {
        label: "Consumo Local",
        color: "bg-primary-light/20 text-primary border-primary/30",
      };
    default:
      return {
        label: reason,
        color: "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
};

export function StockMovementsHistory() {
  const {
    movements,
    isLoading: isLoadingMovements,
    isIndexing,
  } = useStockMovements(100);
  const { users, isLoading: isLoadingUsers } = useUsers();

  const products = useLiveQuery(() => db.products.toArray()) || [];

  const productMap = new Map<string, LocalProduct>(
    products.map((p: LocalProduct) => [p.id, p]),
  );

  const userMap = new Map<string, string>(users.map((u) => [u.uid, u.name]));

  const isLoading = isLoadingMovements || isLoadingUsers;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p className="text-sm font-medium">Cargando historial...</p>
      </div>
    );
  }

  if (isIndexing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-amber-100">
        <RefreshCw className="w-12 h-12 opacity-30 mb-3 text-amber-500 animate-spin-slow" />
        <p className="font-bold text-gray-800 text-center">
          Configurando base de datos...
        </p>
        <p className="text-xs text-center max-w-xs mt-1">
          Firebase está construyendo el índice necesario para este reporte. Esto
          suele tardar **2 a 5 minutos**. Por favor, espera un momento.
        </p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-100">
        <History className="w-12 h-12 opacity-20 mb-3" />
        <p className="font-bold">Sin ajustes manuales</p>
        <p className="text-xs">
          Solo se muestran salidas por pérdida, consumo o corrección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {movements.map((m) => {
          const product = productMap.get(m.productId);
          const userName =
            userMap.get(m.employeeId) ||
            `Usuario (${m.employeeId.substring(0, 5)})`;
          const userPhoto = users.find((u) => u.uid === m.employeeId)?.photoURL;
          const { label, color } = getReasonLabel(m.reason);

          return (
            <div
              key={m.id}
              className="bg-white p-4 rounded-xl border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-200"
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-2 rounded-lg shrink-0 border", color)}>
                  <Package className="w-5 h-5" />
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 leading-tight">
                    {product
                      ? `${product.name} ${product.brand || ""}`
                      : "Producto Desconocido"}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                        color,
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {format(m.createdAt, "dd/MM HH:mm 'hs'", { locale: es })}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-100 pl-2">
                      "{m.description}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0">
                <div className="flex items-center gap-2">
                  <div className=" rounded-full">
                    {userPhoto ? (
                      <Image
                        src={userPhoto || ""}
                        alt={userName || "Usuario"}
                        width={26}
                        height={26}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {userName.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {userName}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-xl font-black",
                      m.quantity > 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                  <span className="text-[9px] font-black text-gray-300 uppercase">
                    {product?.quantityUnit === "unit"
                      ? "unidades"
                      : product?.quantityUnit || "uds"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
