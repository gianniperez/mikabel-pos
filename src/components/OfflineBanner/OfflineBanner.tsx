"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Definir estado inicial (Cuidado: navigator puede no existir en SSR)
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => setIsOffline(!navigator.onLine), 0);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3 w-full animate-in slide-in-from-top-4 z-50 sticky top-0 shadow-lg border-b-4 border-red-700">
      <WifiOff className="h-5 w-5 animate-pulse" />
      <p className="font-bold text-sm md:text-base tracking-wide">
        Estás sin Internet. El modo offline está activo, tus ventas se guardarán
        localmente.
      </p>
    </div>
  );
};
