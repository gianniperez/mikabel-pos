"use client";

import { useState } from "react";
import { PosProductGrid } from "./PosProductGrid";
import { PosCartPanel } from "./PosCartPanel";
import { useGlobalBarcodeScanner } from "../hooks/useGlobalBarcodeScanner";
import { PosTabSwitcher } from "./PosTabSwitcher";
import type { PosTab } from "./PosTabSwitcher/PosTabSwitcher.types";
import { usePosStore } from "../stores/usePosStore";

export const ActivePosTerminal = () => {
  const [activeTab, setActiveTab] = useState<PosTab>("products");
  const cart = usePosStore((state) => state.cart);

  // Activamos el listener físico del escáner láser en todo momento que este componente viva
  useGlobalBarcodeScanner(true);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)] w-full overflow-hidden relative">
      {/* Mobile Tab Switcher */}
      <div className="sm:hidden -mb-2">
        <PosTabSwitcher
          activeTab={activeTab}
          onTabChange={setActiveTab}
          itemCount={cart.length}
        />
      </div>

      <div className="flex flex-1 flex-col sm:flex-row gap-4 overflow-hidden relative">
        <div
          className={
            activeTab === "products"
              ? "flex-1 overflow-hidden py-2 sm:py-4 block"
              : "hidden sm:block sm:flex-1"
          }
        >
          {/* Lado Izquierdo (70% en Desktop, 100% en Mobile) */}
          <PosProductGrid />
        </div>

        <div
          className={
            activeTab === "cart"
              ? "py-2 sm:py-4 block"
              : "hidden sm:block sm:py-4"
          }
        >
          {/* Lado Derecho: Carrito (30% en Desktop, bottom-sheet en Mobile a futuro si es necesario) */}
          <PosCartPanel />
        </div>
      </div>
    </div>
  );
};
