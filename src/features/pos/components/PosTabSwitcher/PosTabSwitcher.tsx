import { LayoutGrid, ShoppingCart } from "lucide-react";
import { clsx } from "clsx";
import type { PosTabSwitcherProps, PosTab } from "./PosTabSwitcher.types";

export function PosTabSwitcher({
  activeTab,
  onTabChange,
  itemCount,
}: PosTabSwitcherProps) {
  const tabs: { id: PosTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "products", label: "Productos", icon: LayoutGrid },
    { id: "cart", label: "Ticket", icon: ShoppingCart },
  ];

  return (
    <div className="flex bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-sm sm:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-bold text-sm cursor-pointer",
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50",
            )}
          >
            <Icon
              className={clsx(
                "w-5 h-5",
                isActive ? "text-white" : "text-gray-400",
              )}
            />
            {tab.label}
            {tab.id === "cart" && itemCount > 0 && (
              <span
                className={clsx(
                  "ml-1 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-black",
                  isActive ? "bg-white text-primary" : "bg-primary text-white",
                )}
              >
                {itemCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
