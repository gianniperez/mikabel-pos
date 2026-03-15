"use client";

import { useQuery } from "@tanstack/react-query";
import { getHourlySalesData } from "../api/reportsDb";
import { Button } from "@/components/Button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export const PeakHoursChart = () => {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["peak-hours-data"],
    queryFn: () => getHourlySalesData(30),
  });

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="flex-1 w-full rounded-2xl" />
      </div>
    );
  }

  // Encontrar la hora pico para el mensaje informativo
  const peakHour = [...chartData].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="bg-white p-6 md:p-8 rouPnded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight">
              Análisis de Horas Pico
            </h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">
              Flujo de Clientes (Últimos 30 días)
            </p>
          </div>
        </div>

        {peakHour && peakHour.count > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-success/5 border border-success/10 rounded-2xl">
            <Users className="w-5 h-5 text-success" />
            <p className="text-xs font-bold text-success-dark">
              Hora de mayor tráfico:{" "}
              <span className="text-sm">{peakHour.hour}</span>
            </p>
          </div>
        )}
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                padding: "12px",
              }}
              itemStyle={{ color: "#1e3a8a", fontWeight: "bold" }}
              labelStyle={{ color: "#64748b", marginBottom: "4px" }}
              formatter={(value: any) => [`${value || 0} Ventas`, "Volumen"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorCount)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-400 font-medium italic">
          * Este gráfico muestra el flujo de ventas por hora basado en los
          últimos 30 días, ayudándote a planificar turnos y reposición de
          mercadería.
        </p>
      </div>
    </div>
  );
};
