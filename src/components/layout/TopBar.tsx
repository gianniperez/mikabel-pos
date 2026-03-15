"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, LogOut, X, Settings, UserPlus, UserPen } from "lucide-react";
import { useAuthStore } from "@/features/auth/stores";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePosStore } from "@/features/pos/stores/usePosStore";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { Button } from "../Button";

export const TopBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { dbUser: user } = useAuthStore();
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden h-14 bg-background-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Image src="/isologo.png" alt="Mikabel" width={24} height={24} />
          <h1 className="text-lg font-extrabold text-primary-dark tracking-tight">
            Mikabel<span className="text-primary">POS</span>
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Menú</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:bg-gray-50 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-mikabel border border-gray-100">
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
              <p className="text-sm font-bold text-gray-900 truncate">
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs font-semibold text-gray-500 truncate capitalize">
                {user?.role && user.role === "admin" ? "Admin" : "Operadora"}
              </p>
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 space-y-1">
                Administración
              </h3>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-mikabel text-sm font-semibold transition-colors ${
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
                onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
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
          <Button
            onClick={() => {
              setIsOpen(false);
              usePosStore.getState().clearCart();
              useCashSessionStore.getState().clearSession();
              auth.signOut();
            }}
            variant="destructive"
            className="text-sm mt-8"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
};
