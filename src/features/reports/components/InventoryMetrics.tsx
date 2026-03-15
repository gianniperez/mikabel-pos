import { useQuery } from "@tanstack/react-query";
import { getLowStockProducts, getTopSellingProducts } from "../api/reportsDb";
import { AlertTriangle, TrendingUp, PackageOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export const InventoryMetrics = () => {
  const { data: lowStockProducts = [], isLoading: isLoadingLow } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: () => getLowStockProducts(20),
  });

  const { data: topSold = [], isLoading: isLoadingTop } = useQuery({
    queryKey: ["top-selling-products"],
    queryFn: () => getTopSellingProducts(30),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alertas Rojas - Stock Bajo */}
      <div className="bg-white border-2 border-danger-light rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-danger-light/30 text-danger rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Atención Inmediata
            </h3>
            <p className="text-sm font-bold text-danger uppercase">
              Stock Crítico
            </p>
          </div>
        </div>

        {isLoadingLow ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="text-center py-8">
            <PackageOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">
              Todo el inventario está saludable.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-danger-light/10 rounded-xl border border-danger-light/20"
              >
                <span className="font-bold text-gray-900">
                  {p.name} {p.brand}
                </span>
                <span className="px-3 py-1 bg-white text-danger font-black rounded-lg shadow-sm border border-danger-light/50">
                  {p.stock} u.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lo Más Vendido */}
      <div className="bg-white border-2 border-success-light rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-success-light/30 text-success rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Productos Estrella
            </h3>
            <p className="text-sm font-bold text-success uppercase">
              Top 5 - Últimos 30 días
            </p>
          </div>
        </div>

        {isLoadingTop ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : topSold.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-gray-400 font-bold text-center">
              Aún no hay ventas registradas
              <br />
              en los últimos 30 días.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topSold.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-success-light/10 rounded-xl border border-success-light/30"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success text-white text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-gray-900">
                    {p.name} {p.brand}
                  </span>
                </div>
                <span className="text-success font-black">
                  {p.count.toFixed(p.count % 1 === 0 ? 0 : 2)}{" "}
                  <span className="text-success-dark text-sm font-bold uppercase opacity-60">
                    Vendidos
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
