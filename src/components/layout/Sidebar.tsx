"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  BarChart3,
  LogOut,
  Settings,
  UserPlus,
  UserPen,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/stores";
import { auth } from "@/lib/firebase";
import { usePosStore } from "@/features/pos/stores/usePosStore";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";

const NAVIGATION = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Deudas", href: "/debts", icon: ReceiptText },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { dbUser: user } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto z-40">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100 mb-4">
        <Image src="/isologo.png" alt="Mikabel" width={32} height={32} />
        <h1 className="text-2xl font-extrabold text-primary-dark tracking-tight">
          Mikabel<span className="text-primary">POS</span>
        </h1>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1">
        {NAVIGATION.filter((item) => {
          if (item.href === "/reports") {
            return user?.role === "admin" || user?.permissions?.view_reports;
          }
          return true;
        }).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-3 rounded-mikabel text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:bg-primary-light/30 hover:text-primary"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-primary"}`}
              />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Tools */}
        {user?.role === "admin" && (
          <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
            <Link
              href="/register"
              className={`group flex items-center gap-3 px-3 py-3 rounded-mikabel text-sm font-semibold transition-colors ${
                pathname === "/register"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:bg-primary-light/30 hover:text-primary"
              }`}
            >
              <UserPlus
                className={`w-5 h-5 ${pathname === "/register" ? "text-white" : "text-gray-400 group-hover:text-primary"}`}
              />
              Registrar Empleado
            </Link>
            <Link
              href="/users"
              className={`group flex items-center gap-3 px-3 py-3 rounded-mikabel text-sm font-semibold transition-colors ${
                pathname === "/users"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:bg-primary-light/30 hover:text-primary"
              }`}
            >
              <UserPen
                className={`w-5 h-5 ${pathname === "/users" ? "text-white" : "text-gray-400 group-hover:text-primary"}`}
              />
              Gestión de Usuarios
            </Link>
            <Link
              href="/settings"
              className={`group flex items-center gap-3 px-3 py-3 rounded-mikabel text-sm font-semibold transition-colors ${
                pathname === "/settings"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:bg-primary-light/30 hover:text-primary"
              }`}
            >
              <Settings
                className={`w-5 h-5 ${pathname === "/settings" ? "text-white" : "text-gray-400 group-hover:text-primary"}`}
              />
              Configuración
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.photoURL ? (
            <Image
              src={user?.photoURL || ""}
              alt={user?.name || "Usuario"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || "Usuario"}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user?.role && user.role === "admin" ? "Admin" : "Operadora"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            usePosStore.getState().clearCart();
            useCashSessionStore.getState().clearSession();
            auth.signOut();
          }}
          className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-danger hover:bg-red-50 rounded-mikabel transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
