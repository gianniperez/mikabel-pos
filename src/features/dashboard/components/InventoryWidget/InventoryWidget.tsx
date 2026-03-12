"use client";

import type { InventoryWidgetProps } from "./InventoryWidget.types";
import { useQuery } from "@tanstack/react-query";
import {
  getLowStockProducts,
  getTopSellingProducts,
} from "@/features/reports/api/reportsDb";
import { AlertTriangle, TrendingUp, Package } from "lucide-react";
import Link from "next/link";

export const InventoryWidget = () => {
  const { data: lowStock = [] } = useQuery({
    queryKey: ["low-stock-summary"],
    queryFn: () => getLowStockProducts(1),
  });

  const { data: topSold = [] } = useQuery({
    queryKey: ["top-selling-summary"],
    queryFn: () => getTopSellingProducts(1),
  });

  return (
    <Link
      href="/reports?tab=inventory"
      className="block transform transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="bg-white border-2 border-primary-light/50 rounded-3xl p-6 shadow-sm relative overflow-hidden h-full cursor-pointer hover:border-primary-light">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-light/30 text-primary rounded-xl">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Inventario
            </h3>
            <p className="text-xs font-medium text-primary uppercase tracking-widest">
              Resumen Crítico
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Alerta de Stock */}
          <div
            className={`flex items-center justify-between p-4 ${lowStock.length > 0 ? "bg-danger/10 border-danger/20" : "bg-success/10 border-success/20"} rounded-2xl border`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`w-5 h-5 ${lowStock.length > 0 ? "text-danger" : "text-success"}`}
              />
              <span
                className={`text-sm font-bold ${lowStock.length > 0 ? "text-danger" : "text-success"}`}
              >
                Stock Crítico
              </span>
            </div>
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full ${lowStock.length > 0 ? "bg-danger" : "bg-success"} text-white font-black text-sm`}
            >
              {lowStock.length > 0 ? "+" : "0"}
            </span>
          </div>

          {/* Producto Estrella */}
          {topSold[0] && (
            <div className="flex items-center justify-between p-4 bg-primary-light/30 rounded-2xl border border-primary-light">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-primary">
                    Producto Estrella
                  </span>
                  <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                    {topSold[0].name} {topSold[0].brand}
                  </span>
                </div>
              </div>
              <span className="text-primary font-black text-lg">#{1}</span>
            </div>
          )}
        </div>

        {/* Visual touch */}
        <div className="absolute -bottom-6 -right-6 text-orange-50 opacity-10 transform -rotate-12">
          <Package className="w-32 h-32" />
        </div>
      </div>
    </Link>
  );
};
