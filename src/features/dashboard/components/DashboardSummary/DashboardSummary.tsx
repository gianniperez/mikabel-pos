"use client";

import { ShoppingCart, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { CashSessionWidget } from "../CashSessionWidget";
import { InventoryWidget } from "../InventoryWidget";
import { CustomersWidget } from "../CustomersWidget";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";

export const DashboardSummary = () => {
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";

  return (
    <div className="space-y-8">
      {/* Quick Actions Bar */}
      <section>
        <div className="flex flex-col gap-4">
          <Link href="/pos" className="flex-1">
            <Button className="h-18 md:h-24 md:text-xl transition-all hover:scale-[1.02]">
              <ShoppingCart className="w-8 h-8 text-white" />
              Nueva Venta
            </Button>
          </Link>

          {isAdmin ||
            dbUser?.permissions?.edit_stock ||
            (dbUser?.permissions?.edit_product && (
              <Link href="/inventory">
                <Button
                  variant="outline"
                  className="w-full h-24 md:text-lg hover:border-secondary-light hover:bg-secondary-light/20 flex flex-col text-gray-500 hover:text-secondary transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-6 h-6 mb-1" />
                  Cargar Stock
                </Button>
              </Link>
            ))}
        </div>
      </section>

      {/* Widgets Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CashSessionWidget />
        <InventoryWidget />
        <CustomersWidget />
      </section>
    </div>
  );
};
