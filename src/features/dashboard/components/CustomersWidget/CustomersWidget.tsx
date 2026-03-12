"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/features/debts/api/debtsDb";
import { Users, AlertCircle } from "lucide-react";

import Link from "next/link";

export const CustomersWidget = () => {
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-summary"],
    queryFn: getCustomers,
  });

  const topDebtors = [...customers]
    .sort((a, b) => b.totalDebt - a.totalDebt)
    .slice(0, 3)
    .filter((c) => c.totalDebt > 0);

  return (
    <Link
      href="/debts"
      className="h-68 block transform transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="bg-white border-2 border-terciary/50 rounded-3xl p-6 shadow-sm relative overflow-hidden h-full cursor-pointer hover:border-terciary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-terciary-light/30 text-terciary rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Fiadores
            </h3>
            <p className="text-xs font-medium text-terciary uppercase tracking-widest">
              Mayores Deudas
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {topDebtors.length === 0 ? (
            <div className="py-6 text-center text-gray-400 font-bold text-sm">
              No hay deudas pendientes 🎉
            </div>
          ) : (
            topDebtors.map((customer, idx) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-terciary-light/30 border border-terciary flex items-center justify-center font-black text-terciary text-xs">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-gray-900 text-sm truncate max-w-[140px]">
                    {customer.name}
                  </span>
                </div>
                <span className="font-black text-danger text-sm">
                  ${customer.totalDebt}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Visual touch */}
        <div className="absolute -bottom-6 -right-6 text-terciary opacity-10 transform -rotate-12">
          <Users className="w-32 h-32" />
        </div>
      </div>
    </Link>
  );
};
