"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Loader2, Play } from "lucide-react";
import { useAuthStore } from "@/features/auth/stores";
import {
  subscribeToActiveSessions,
  type ActiveSessionWithUser,
} from "../api/shifts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card } from "@/components/Card";

export const ActiveShiftsBoard = () => {
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";

  const [activeSessions, setActiveSessions] = useState<ActiveSessionWithUser[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToActiveSessions((sessions) => {
      setActiveSessions(sessions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className="w-full h-12 flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Buscando turnos activos...</span>
      </div>
    );
  }

  return (
    <Card className="bg-gray-50/50 border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-none">
              Turnos Activos
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
              Monitoreo en tiempo real
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-black text-success uppercase">
            {activeSessions.length} Operando
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeSessions.length === 0 ? (
          <div className="col-span-full py-4 text-center border-2 border-dashed border-gray-100 rounded-mikabel">
            <p className="text-xs text-gray-400 font-bold italic">
              No hay cajas abiertas en este momento
            </p>
          </div>
        ) : (
          activeSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white p-3 rounded-mikabel border border-gray-100 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black group-hover:bg-primary/10 transition-colors">
                  {session.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
                    {session.userName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[11px] text-gray-500 font-medium">
                      Inició{" "}
                      {session.openedAt > 0
                        ? format(session.openedAt, "HH:mm 'hs'", { locale: es })
                        : "--:--"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-1.5 py-0.5 rounded leading-none">
                  Caja #{session.id.slice(-4).toUpperCase()}
                </span>
                <span className="text-[9px] text-gray-400 font-bold tracking-tighter mt-1 italic">
                  Abierta hace{" "}
                  {Math.floor((Date.now() - session.openedAt) / 60000)} min
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
