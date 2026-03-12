"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  BarChart3,
} from "lucide-react";

// The bottom bar is extremely limited in space, so we only show the absolute most important routes.
// "Reportes" might be left for a 'more' menu or just desktop, but let's include it if it fits.
const MOBILE_NAV = [
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Deudas", href: "/debts", icon: ReceiptText },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
];

export const BottomBar = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <ul className="flex justify-around items-center h-16">
        {MOBILE_NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.name} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center h-full space-y-1 ${
                  isActive
                    ? "text-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${isActive ? "text-primary" : ""}`}
                />
                <span
                  className={`text-[10px] font-semibold ${isActive ? "text-primary" : ""}`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
